import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

import { runNode } from "../../chat/runtime/nodeRunner"
import { createLobbyState } from "../../chat/kernel/state"
import type { InputSignal, KernelResult, LogEvent } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"

import { appendInteraction, appendLog } from "../../chat/logging/sink"
import { appendTelemetryTurn } from "../../chat/telemetry/store"
import { readUserProfile, recordTurn, writeUserProfile } from "../../chat/memory/store"
import { consolidateV1 } from "../../chat/platform/consolidation"
import {
  readConversationState,
  writeConversationState,
} from "../../chat/persistence/conversationStateStore"
import {
  applyAutoThreadLabelFromText,
  ensureThreadIndex,
  setActiveThread,
  upsertThread,
  writeThreadIndex,
} from "../../chat/persistence/threadIndexStore"
import { appendSpineEventV23 } from "../../chat/observability/spineStore"

import { ensureDefaultThemeAndEpisode } from "../../chat/memory/longTermMemoryStore"
import { enqueueJob, makeJobId } from "../../chat/async/queue"

type ChatRequestBody = {
  state: any
  input: InputSignal
}

const COOKIE_NAME = "gaarsdal_uid"
const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60
const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60
const PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60

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

function toLobbyConversationId(userKey: string): string {
  return `lobby:u:${userKey}`
}

function eventId(): string {
  return (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex")
}

function metaDomains(keys: string[]): string[] {
  const domains = new Set<string>()
  for (const k of keys) {
    const idx = k.indexOf(".")
    domains.add(idx > 0 ? k.slice(0, idx) : k)
  }
  return Array.from(domains)
}

function isLobbyConversation(conversationId: string): boolean {
  return conversationId.startsWith("lobby:u:")
}

function isControlInput(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return true
  if (t === "continue" || t === "fortsæt" || t === "fortsaet") return true
  if (t === "new" || t === "ny") return true
  if (t.startsWith("c:")) return true
  return false
}

async function maybeAutoLabelThread(params: {
  userKey: string
  conversationId: string
  input: InputSignal
}): Promise<void> {
  const { userKey, conversationId, input } = params

  if (isLobbyConversation(conversationId)) return
  if (input.type !== "FREE_TEXT") return

  const userText = input.text ?? ""
  if (userText.trim().length < 12) return
  if (isControlInput(userText)) return

  const index0 = await ensureThreadIndex({
    userKey,
    ttlSeconds: PROFILE_TTL_SECONDS,
  })

  const existingThread = index0.threads.find(
    (t) => t.conversation_id === conversationId
  )

  const needsLabel =
    !existingThread ||
    !existingThread.title?.trim() ||
    !existingThread.preview?.trim()

  if (!needsLabel) return

  let index1 = upsertThread({
    index: index0,
    conversationId,
  })

  index1 = applyAutoThreadLabelFromText({
    index: index1,
    conversationId,
    userText,
    maxTitleChars: 60,
    maxPreviewChars: 120,
  })

  index1 = setActiveThread({
    index: index1,
    conversationId,
  })

  if (JSON.stringify(index0) === JSON.stringify(index1)) return

  await writeThreadIndex({
    userKey,
    index: index1,
    ttlSeconds: PROFILE_TTL_SECONDS,
  })
}

async function persistState(result: KernelResult): Promise<void> {
  await writeConversationState(result.state, SESSION_TTL_SECONDS)
}

async function emitSpine(params: {
  userKey: string
  input: InputSignal
  kernelResult: KernelResult
  latencyMs?: number
  error?: { code: string; message: string; retryable?: boolean }
}): Promise<void> {
  const { kernelResult, input, userKey, latencyMs, error } = params
  const keys = kernelResult.transition.meta_delta
    ? Object.keys(kernelResult.transition.meta_delta)
    : []
  const domains = keys.length ? metaDomains(keys) : []

  await appendSpineEventV23({
    schema_version: "v23",
    event_id: eventId(),
    user_key: userKey,
    conversation_id: kernelResult.state.conversation_id,
    revision_before: kernelResult.log.revision_before,
    revision_after: kernelResult.log.revision_after,
    node_before: kernelResult.log.active_node_before,
    node_after: kernelResult.log.active_node_after,
    status_after: kernelResult.state.status,
    input_type: (input as any).type,
    transition_type: kernelResult.transition.type,
    meta_domains_written: domains,
    meta_keys_written: keys,
    latency_ms: latencyMs,
    error,
  })
}

async function enqueueSummarizeEpisode(params: {
  userKey: string
  conversationId: string
  revisionAfter: number
}): Promise<void> {
  const N = 8
  if (params.revisionAfter <= 0) return
  if (params.revisionAfter % N !== 0) return

  const ensured = await ensureDefaultThemeAndEpisode({
    userKey: params.userKey,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })

  const job_id = makeJobId({
    type: "SUMMARIZE_EPISODE",
    userKey: params.userKey,
    episodeId: ensured.episode.episode_id,
    revisionAfter: params.revisionAfter,
  })

  await enqueueJob({
    schema_version: "v23",
    job_version: 1,
    type: "SUMMARIZE_EPISODE",
    job_id,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    theme_id: ensured.theme.theme_id,
    episode_id: ensured.episode.episode_id,
    revision_after: params.revisionAfter,
  })
}

async function enqueueSuggestFacts(params: {
  userKey: string
  conversationId: string
  revisionAfter: number
  metaKeysWritten: string[]
}): Promise<void> {
  const touched = params.metaKeysWritten.some(
    (k) => k.startsWith("triage.") || k.startsWith("memory_candidates.")
  )
  if (!touched) return

  const ensured = await ensureDefaultThemeAndEpisode({
    userKey: params.userKey,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })

  const job_id = makeJobId({
    type: "SUGGEST_FACTS",
    userKey: params.userKey,
    episodeId: ensured.episode.episode_id,
    revisionAfter: params.revisionAfter,
  })

  await enqueueJob({
    schema_version: "v23",
    job_version: 1,
    type: "SUGGEST_FACTS",
    job_id,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    theme_id: ensured.theme.theme_id,
    episode_id: ensured.episode.episode_id,
    revision_after: params.revisionAfter,
  })
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
    kernelResult.transition.response_message ??
    kernelResult.state.active_node_message

  await appendInteraction({
    conversation_id: kernelResult.state.conversation_id,
    revision: kernelResult.state.revision,
    active_node: kernelResult.state.active_node,
    input_type: (input as any).type,
    user_input: params.userText,
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

  const activeNode = getNode(kernelResult.state.active_node)
  await appendTelemetryTurn({
    conversation_id: kernelResult.state.conversation_id,
    user_key: params.userKey,
    revision: kernelResult.state.revision,
    node_id: kernelResult.state.active_node,
    input_type: (input as any).type,
    user_input_raw: params.userText,
    assistant_output_raw: assistantText,
    transition_type: kernelResult.transition.type,
    outcome_node: kernelResult.transition.to,
    capability_id:
      activeNode.kind === "DIALOG"
        ? activeNode.capability_id ?? null
        : null,
    meta_keys_written: kernelResult.transition.meta_delta
      ? Object.keys(kernelResult.transition.meta_delta)
      : [],
  })

  const profile = await readUserProfile(params.userKey)
  if (profile) {
    const { profile: updated, updated: didUpdate } = consolidateV1({
      profile,
      state: kernelResult.state,
    })
    if (didUpdate) {
      await writeUserProfile({
        userKey: params.userKey,
        profile: updated,
        ttlSeconds: PROFILE_TTL_SECONDS,
      })
    }
  }
}

function isAutoAdvanceNode(node: { id: string; kind: unknown }): boolean {
  if (node.kind === "ROUTER" && node.id === "HOME") return false
  return (
    node.kind === "ROUTER" ||
    node.kind === "TOOL" ||
    node.kind === "CHECKPOINT"
  )
}

function validateRequest(
  req: NextApiRequest,
  res: NextApiResponse
): ChatRequestBody | null {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" })
    return null
  }

  if (!isObject(req.body)) {
    res.status(400).json({ error: "Invalid JSON body" })
    return null
  }

  const body = req.body as ChatRequestBody
  const input = (body as any).input
  if (!input || !isObject(input) || typeof (input as any).type !== "string") {
    res.status(400).json({ error: "Missing or invalid input" })
    return null
  }

  return body
}

async function runTurnWithAutoAdvance(params: {
  baseState: any
  input: InputSignal
  userKey: string
}): Promise<KernelResult> {
  const { baseState, input, userKey } = params

  let kernelResult = await runNode({
    state: baseState,
    input,
    userKey,
  })

  for (let i = 0; i < 5; i++) {
    const activeNode = getNode(kernelResult.state.active_node)
    if (!isAutoAdvanceNode(activeNode)) break

    const before = kernelResult.state.active_node
    kernelResult = await runNode({
      state: kernelResult.state,
      input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
      userKey,
    })
    const after = kernelResult.state.active_node
    if (after === before) break
  }

  return kernelResult
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const started = Date.now()
  const body = validateRequest(req, res)
  if (!body) return

  const userKey = ensureUserKey(req, res)
  const lobbyConversationId = toLobbyConversationId(userKey)

  const { state: clientState, input } = body

  if (clientState === null) {
    const storedLobby = await readConversationState(lobbyConversationId)

    if (storedLobby) {
      await persistState({
        state: storedLobby,
        transition: {
          type: "INIT",
          from: null,
          to: storedLobby.active_node,
          reason: "system init (restored)",
        },
        log: {
          conversation_id: storedLobby.conversation_id,
          revision_before: storedLobby.revision,
          revision_after: storedLobby.revision,
          active_node_before: storedLobby.active_node,
          active_node_after: storedLobby.active_node,
          input_type: "SYSTEM_INIT",
          transition_type: "INIT",
          timestamp: new Date().toISOString(),
        },
      } as any)

      res.status(200).json({
        state: storedLobby,
        transition: {
          type: "INIT",
          from: null,
          to: storedLobby.active_node,
          reason: "system init (restored)",
        },
      })
      return
    }

    const initialState = createLobbyState(lobbyConversationId)
    await writeConversationState(initialState, SESSION_TTL_SECONDS)

    res.status(200).json({
      state: initialState,
      transition: {
        type: "INIT",
        from: null,
        to: initialState.active_node,
        reason: "system init",
      },
    })
    return
  }

  const conversationId =
    typeof clientState?.conversation_id === "string"
      ? clientState.conversation_id
      : lobbyConversationId

  const stored = await readConversationState(conversationId)
  const baseState = stored ?? clientState

  try {
    const kernelResult = await runTurnWithAutoAdvance({
      baseState,
      input,
      userKey,
    })

    await persistState(kernelResult)

    await maybeAutoLabelThread({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      input,
    })

    const metaKeysWritten = kernelResult.transition.meta_delta
      ? Object.keys(kernelResult.transition.meta_delta)
      : []

    await emitSpine({
      userKey,
      input,
      kernelResult,
      latencyMs: Date.now() - started,
    })

    await enqueueSummarizeEpisode({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      revisionAfter: kernelResult.state.revision,
    })

    await enqueueSuggestFacts({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      revisionAfter: kernelResult.state.revision,
      metaKeysWritten,
    })

    await logAndRecord({
      userKey,
      input,
      kernelResult,
      userText:
        input.type === "FREE_TEXT" ? input.text : undefined,
    })

    res.status(200).json(kernelResult)
  } catch (e: any) {
    res.status(500).json({ error: "Internal Server Error" })
  }
}
