import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

import { runNode } from "../../chat/runtime/nodeRunner"
import { createInitialState } from "../../chat/kernel/state"
import type { InputSignal, KernelResult, LogEvent } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"

import { appendInteraction, appendLog } from "../../chat/logging/sink"
import { appendTelemetryTurn } from "../../chat/telemetry/store"
import { readUserProfile, writeUserProfile } from "../../chat/memory/store"
import { consolidateV1 } from "../../chat/platform/consolidation"
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
const PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

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
  if (input.type === "FREE_TEXT") return (input as any).text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${(input as any).target}`
  if (input.type === "SYSTEM") return `SYSTEM:${(input as any).intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
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
    input_type: (input as any).type,
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

  // Telemetry (dev): raw input/output for replay and prompt iteration.
  const activeNode = getNode(kernelResult.state.active_node)
  await appendTelemetryTurn({
    conversation_id: kernelResult.state.conversation_id,
    user_key: params.userKey,
    revision: kernelResult.state.revision,
    node_id: kernelResult.state.active_node,
    input_type: (input as any).type,
    user_input_raw: params.userText ?? toUserInput(input),
    assistant_output_raw: assistantText,
    transition_type: kernelResult.transition.type,
    outcome_node: kernelResult.transition.to,
    capability_id: activeNode.kind === "DIALOG" ? activeNode.capability_id ?? null : null,
    meta_keys_written: kernelResult.transition.meta_delta
      ? Object.keys(kernelResult.transition.meta_delta)
      : [],
  })

  // Deferred consolidation (C-mode): update core semantic hints in profile.
  const profile = await readUserProfile(params.userKey)
  if (profile) {
    const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: kernelResult.state })
    if (didUpdate) {
      await writeUserProfile({ userKey: params.userKey, profile: updated, ttlSeconds: PROFILE_TTL_SECONDS })
    }
  }
}

function isAutoNodeKind(kind: unknown): boolean {
  return kind === "ROUTER" || kind === "TOOL" || kind === "CHECKPOINT"
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

  // ---------- NODE RUNTIME (dispatch by kind) ----------
  let kernelResult = await runNode({ state: baseState, input, userKey })

  // Auto-advance ROUTER/TOOL/CHECKPOINT nodes to avoid manual "go" turns.
  // Guarded to prevent loops.
  for (let i = 0; i < 5; i++) {
    const activeNode = getNode(kernelResult.state.active_node)
    if (!isAutoNodeKind(activeNode.kind)) break

    const before = kernelResult.state.active_node
    kernelResult = await runNode({
      state: kernelResult.state,
      input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
      userKey,
    })
    const after = kernelResult.state.active_node
    if (after === before) break
  }

  await persistState(kernelResult)
  await logAndRecord({
    userKey,
    input,
    kernelResult,
    userText: (input as any).type === "FREE_TEXT" ? (input as any).text : undefined,
  })
  return res.status(200).json(kernelResult)
}
