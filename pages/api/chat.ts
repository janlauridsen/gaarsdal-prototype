import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"
import { runKernel } from "../../chat/kernel/engine"
import { createInitialState } from "../../chat/kernel/state"
import { appendInteraction, appendLog } from "../../chat/logging/sink"
import type { InputSignal, KernelResult, LogEvent } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"
import { runCapability } from "../../chat/ai/runtime"

type ChatRequestBody = {
  state: any
  input: InputSignal
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return input.text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${input.target}`
  if (input.type === "SYSTEM") return `SYSTEM:${input.intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

/**
 * TODO (P3): move to registry (node.capability_id) or separate dialog registry.
 */
function resolveCapabilityId(nodeId: string): string | null {
  if (nodeId === "TRIAGE") return "triage-relevance-v1"
  if (nodeId === "GEN_HYPNO") return "gen-hypno-v1"
  if (nodeId === "METHOD_FIT") return "method-fit-v1"
  return null
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

/**
 * Ensures anon device identity via HttpOnly cookie.
 * Returns the user key.
 */
function ensureUserKey(req: NextApiRequest, res: NextApiResponse): string {
  const COOKIE_NAME = "gaarsdal_uid"

  const existing = req.cookies?.[COOKIE_NAME]
  if (existing && typeof existing === "string" && existing.trim().length >= 8) {
    return existing
  }

  const uid = crypto.randomUUID()
  const maxAgeSeconds = 90 * 24 * 60 * 60 // 90 days

  const secure = process.env.NODE_ENV === "production"

  res.setHeader(
    "Set-Cookie",
    buildCookie({
      name: COOKIE_NAME,
      value: uid,
      maxAgeSeconds,
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
    })
  )

  return uid
}

async function logKernelResult(
  result: KernelResult,
  input: InputSignal,
  userInputOverride?: string
): Promise<void> {
  await appendLog(result.log)

  const aiText =
    result.transition.response_message ??
    result.state.active_node_message

  await appendInteraction({
    conversation_id: result.state.conversation_id,
    revision: result.state.revision,
    active_node: result.state.active_node,
    input_type: input.type,
    user_input: userInputOverride ?? toUserInput(input),
    ai_response: aiText,
    outcome_node: result.transition.to,
    timestamp: new Date().toISOString(),
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  // Ensure anon identity cookie for ALL requests (init + normal)
  const userKey = ensureUserKey(req, res)

  if (!isObject(req.body)) {
    return res.status(400).json({ error: "Invalid JSON body" })
  }

  const { state, input } = req.body as ChatRequestBody

  if (!input || !isObject(input) || typeof (input as any).type !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" })
  }

  // ---------- INIT ----------
  if (state === null) {
    // stable per-device conversation id (no login)
    const conversationId = `u:${userKey}`

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

    await appendLog(payload.log)
    return res.status(200).json(payload)
  }

  // ---------- DIALOG FREE TEXT (generic) ----------
  if (state && input.type === "FREE_TEXT") {
    const node = getNode(state.active_node)

    if (node.kind === "DIALOG") {
      const capabilityId = resolveCapabilityId(node.id)

      if (capabilityId) {
        const capabilityResult = await runCapability(capabilityId, {
          state,
          userText: input.text,
        })

        const kernelResult = runKernel(state, {
          type: "FREE_TEXT_RESOLVED",
          proposed_transition: capabilityResult.transition,
        })

        await logKernelResult(kernelResult, input, input.text)
        return res.status(200).json(kernelResult)
      }
    }
  }

  // ---------- NORMAL ----------
  const result = runKernel(state, input)
  await logKernelResult(result, input)
  return res.status(200).json(result)
}
