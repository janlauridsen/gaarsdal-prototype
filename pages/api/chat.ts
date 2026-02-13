import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

import { runKernel } from "../../chat/kernel/engine"
import { createInitialState } from "../../chat/kernel/state"
import type { InputSignal, KernelResult, LogEvent } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"

import { appendInteraction, appendLog } from "../../chat/logging/sink"
import { runCapability } from "../../chat/ai/runtime"
import {
  readConversationState,
  writeConversationState,
} from "../../chat/persistence/conversationStateStore"
import { recordTurn } from "../../chat/memory/store"

type ChatRequestBody = {
  state: any
  input: InputSignal
}

const COOKIE_NAME = "gaarsdal_uid"
const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days
const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function buildCookie(options: {
  name: string
  value: string
  maxAgeSeconds: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: "Lax" | "Strict" | "None"
  path?: string
}): string {
  const parts: string[] = []
  parts.push(`${options.name}=${encodeURIComponent(options.value)}`)
  parts.push(`Max-Age=${options.maxAgeSeconds}`)
  parts.push(`Path=${options.path ?? "/"}`)
  parts.push(`SameSite=${options.sameSite ?? "Lax"}`)
  if (options.httpOnly) parts.push("HttpOnly")
  if (options.secure) parts.push("Secure")
  return parts.join("; ")
}

function ensureUserKey(req: NextApiRequest, res: NextApiResponse): string {
  const existing = req.cookies?.[COOKIE_NAME]
  if (existing && typeof existing === "string" && existing.trim().length >= 8) {
    return existing
  }

  const uid = crypto.randomUUID()
  const secure = process.env.NODE_ENV === "production"

  res.setHeader(
    "Set-Cookie",
    buildCookie({
      name: COOKIE_NAME,
      value: uid,
      maxAgeSeconds: SESSION_TTL_SECONDS,
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
    })
  )

  return uid
}

function toConversationId(userKey: string): string {
  return `u:${userKey}`
}

function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return input.text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${input.target}`
  if (input.type === "SYSTEM") return `SYSTEM:${input.intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

function resolveCapabilityId(nodeId: string): string | null {
  if (nodeId === "TRIAGE") return "triage-relevance-v1"
  if (nodeId === "GEN_HYPNO") return "gen-hypno-v1"
  if (nodeId === "METHOD_FIT") return "method-fit-v1"
  return null
}

async function persistState(result: KernelResult): Promise<void> {
  await writeConversationState(result.state, SESSION_TTL_SECONDS)
}

async function logAndRecord(params: {
  userKey: string
  input: InputSignal
  kernelResult: KernelResult
  userText?: string
}): Promise<void> {
  const { kernelResult, input } = params

  await appendLog(kernelResult.log)

  const assistantText =
    kernelResult.transition.response_message ?? kernelResult.state.active_node_message

  await appendInteraction({
    conversation_id: kernelResult.state.conversation_id,
    revision: kernelResult.state.revision,
    active_node: kernelResult.state.active_node,
    input_type: input.type,
    user_input: params.userText ?? toUserInput(input),
    ai_response: assistantText,
    outcome_node: kernelResult.transition.to,
    timestamp: new Date().toISOString(),
  })

  await recordTurn({
    userKey: params.userKey,
    conversationId: kernelResult.state.conversation_id,
    state: kernelResult.state,
    userText: params.userText,
    assistantText,
    transitionType: kernelResult.transition.type,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const conversationId = toConversationId(userKey)

  if (!isObject(req.body)) {
    return res.status(400).json({ error: "Invalid JSON body" })
  }

  const { state: clientState, input } = req.body as ChatRequestBody

  if (!input || !isObject(input) || typeof (input as any).type !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" })
  }

  // Server is source-of-truth for persistence.
  const stored = await readConversationState(conversationId)

  // ---------- INIT / RESTORE ----------
  if (clientState === null) {
    if (stored) {
      const log: LogEvent = {
        conversation_id: stored.conversation_id,
        revision_before: stored.revision,
        revision_after: stored.revision,
        active_node_before: stored.active_node,
        active_node_after: stored.active_node,
        input_type: "SYSTEM_INIT",
        transition_type: "INIT",
        timestamp: new Date().toISOString(),
      }

      const payload = {
        state: stored,
        transition: {
          type: "INIT",
          from: null,
          reason: "system init (restored)",
        },
        log,
      }

      await appendLog(payload.log)
      return res.status(200).json(payload)
    }

    const initialState = createInitialState(conversationId)

    const log: LogEvent = {
      conversation_id: initialState.conversation_id,
      revision_before: -1,
      revision_after: initialState.revision,
      active_node_before: null,
      active_node_after: initialState.active_node,
      input_type: "SYSTEM_INIT",
      transition_type: "INIT",
      timestamp: new Date().toISOString(),
    }

    const payload = {
      state: initialState,
      transition: {
        type: "INIT",
        from: null,
        reason: "system init",
      },
      log,
    }

    await writeConversationState(initialState, SESSION_TTL_SECONDS)
    await appendLog(payload.log)
    return res.status(200).json(payload)
  }

  // Backwards compatible fallback: if no stored state, use client state.
  const baseState = stored ?? clientState

  // ---------- GENERIC DIALOG FREE TEXT ----------
  if (baseState && input.type === "FREE_TEXT") {
    const node = getNode(baseState.active_node)

    if (node.kind === "DIALOG") {
      const capabilityId = resolveCapabilityId(node.id)

      if (capabilityId) {
        const capabilityResult = await runCapability(capabilityId, {
          state: baseState,
          userText: input.text,
        })

        const kernelResult = runKernel(baseState, {
          type: "FREE_TEXT_RESOLVED",
          proposed_transition: capabilityResult.transition,
        })

        await persistState(kernelResult)
        await logAndRecord({ userKey, input, kernelResult, userText: input.text })
        return res.status(200).json(kernelResult)
      }
    }
  }

  // ---------- NORMAL ----------
  const kernelResult = runKernel(baseState, input)
  await persistState(kernelResult)
  await logAndRecord({ userKey, input, kernelResult })
  return res.status(200).json(kernelResult)
}
