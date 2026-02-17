import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

import { runNode } from "../../chat/runtime/nodeRunner"
import { createInitialState, createLobbyState } from "../../chat/kernel/state"
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
import { appendConversationEventV1 } from "../../chat/events/store"

import { ensureDefaultThemeAndEpisode } from "../../chat/memory/longTermMemoryStore"
import { enqueueJob, makeJobId } from "../../chat/async/queue"

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

function toLobbyConversationId(userKey: string): string {
  return `lobby:u:${userKey}`
}

function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return (input as any).text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${(input as any).target}`
  if (input.type === "SYSTEM") return `SYSTEM:${(input as any).intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

function eventId(): string {
  return (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex")
}

function nowMs(): number {
  return Date.now()
}

function envTrue(name: string): boolean {
  const v = process.env[name]
  if (!v) return false
  const t = v.trim().toLowerCase()
  return t === "1" || t === "true" || t === "yes" || t === "on"
}

function truncateText(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + "…"
}

function shouldIncludeRawText(): boolean {
  // Default off to reduce risk of PII in canonical events.
  return envTrue("GAARSDAL_EVENTS_INCLUDE_TEXT")
}

async function emitCanonicalEvent(params: {
  userKey: string
  conversationId: string
  revision: number
  inputId: number
  nodeId?: string | null
  eventType: string
  payload: unknown
}): Promise<void> {
  await appendConversationEventV1({
    schema_version: "v1",
    event_id: eventId(),
    event_type: params.eventType as any,
    conversation_id: params.conversationId,
    user_key: params.userKey,
    revision: params.revision,
    input_id: params.inputId,
    node_id: params.nodeId ?? undefined,
    timestamp_ms: nowMs(),
    payload: params.payload,
  })
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
  revisionAfter: number
}): Promise<void> {
  if (isLobbyConversation(params.conversationId)) return
  if (params.input.type !== "FREE_TEXT") return

  const userText = params.input.text ?? ""
  if (userText.trim().length < 12) return
  if (isControlInput(userText)) return

  const index0 = await ensureThreadIndex({ userKey: params.userKey, ttlSeconds: PROFILE_TTL_SECONDS })

  const existing = index0.threads.find((t) => t.conversation_id === params.conversationId)
  const needsLabel = !existing || !existing.title?.trim() || !existing.preview?.trim()
  if (!needsLabel) return

  // Ensure thread exists in index (covers restores or direct navigation).
  let index1 = upsertThread({ index: index0, conversationId: params.conversationId })
  index1 = applyAutoThreadLabelFromText({
    index: index1,
    conversationId: params.conversationId,
    userText,
    maxTitleChars: 60,
    maxPreviewChars: 120,
  })
  index1 = setActiveThread({ index: index1, conversationId: params.conversationId })

  // Only write if changed materially (simple JSON compare).
  if (JSON.stringify(index0) === JSON.stringify(index1)) return

  await writeThreadIndex({ userKey: params.userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })
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
  const keys = kernelResult.transition.meta_delta ? Object.keys(kernelResult.transition.meta_delta) : []
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
  // Trigger rule (v23):
  // - when triage.* OR memory_candidates.* writes occur, enqueue; otherwise no-op.
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
    meta_keys_written: kernelResult.transition.meta_delta ? Object.keys(kernelResult.transition.meta_delta) : [],
  })

  const profile = await readUserProfile(params.userKey)
  if (profile) {
    const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: kernelResult.state })
    if (didUpdate) {
      await writeUserProfile({ userKey: params.userKey, profile: updated, ttlSeconds: PROFILE_TTL_SECONDS })
    }
  }
}

function isAutoAdvanceNode(node: { id: string; kind: unknown }): boolean {
  if (node.kind === "ROUTER" && node.id === "HOME") return false
  return node.kind === "ROUTER" || node.kind === "TOOL" || node.kind === "CHECKPOINT"
}

function validateRequest(req: NextApiRequest, res: NextApiResponse): ChatRequestBody | null {
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

async function handleInitOrRestore(params: {
  clientState: any
  storedState: any | null
  conversationId: string
  userKey: string
  res: NextApiResponse
}): Promise<boolean> {
  const { clientState, storedState, conversationId, userKey, res } = params
  if (clientState !== null) return false

  if (storedState) {
    const log: LogEvent = {
      conversation_id: storedState.conversation_id,
      revision_before: storedState.revision,
      revision_after: storedState.revision,
      active_node_before: storedState.active_node,
      active_node_after: storedState.active_node,
      input_type: "SYSTEM_INIT",
      transition_type: "INIT",
      timestamp: new Date().toISOString(),
    }

    const payload = {
      state: storedState,
      transition: {
        type: "INIT",
        from: null,
        reason: "system init (restored)",
      },
      log,
    }

    await appendLog(payload.log)

    await appendSpineEventV23({
      schema_version: "v23",
      event_id: eventId(),
      user_key: userKey,
      conversation_id: storedState.conversation_id,
      revision_before: storedState.revision,
      revision_after: storedState.revision,
      node_before: storedState.active_node,
      node_after: storedState.active_node,
      status_after: storedState.status,
      input_type: "SYSTEM_INIT",
      transition_type: "INIT",
    })

    // Auto-advance lobby through TOOL/CHECKPOINT/ROUTER nodes so the user lands on a usable prompt.
    const advanced = await runTurnWithAutoAdvance({
      baseState: payload.state,
      input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
      userKey,
    })

    await persistState(advanced)

    // Canonical events (V1): represent the resulting applied transition and rendered node after auto-advance.
    await emitCanonicalEvent({
      userKey,
      conversationId: advanced.state.conversation_id,
      revision: advanced.state.revision,
      inputId: advanced.state.revision,
      nodeId: advanced.state.active_node,
      eventType: "transition_applied",
      payload: {
        input_type: "SYSTEM_INIT",
        transition: {
          type: advanced.transition.type,
          from: advanced.transition.from,
          to: advanced.transition.to ?? null,
          reason: advanced.transition.reason,
          meta_keys_written: advanced.transition.meta_delta ? Object.keys(advanced.transition.meta_delta) : [],
        },
        status_after: advanced.state.status,
      },
    })

    await emitCanonicalEvent({
      userKey,
      conversationId: advanced.state.conversation_id,
      revision: advanced.state.revision,
      inputId: advanced.state.revision,
      nodeId: advanced.state.active_node,
      eventType: "node_rendered",
      payload: {
        node_id: advanced.state.active_node,
        message: truncateText(advanced.state.active_node_message ?? "", 800),
        status: advanced.state.status,
      },
    })

    res.status(200).json(advanced)
    return true
  }

  const initialState = createLobbyState(conversationId)

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

  await writeConversationState(initialState, SESSION_TTL_SECONDS)
  await appendLog(log)

  await appendSpineEventV23({
    schema_version: "v23",
    event_id: eventId(),
    user_key: userKey,
    conversation_id: initialState.conversation_id,
    revision_before: -1,
    revision_after: initialState.revision,
    node_before: null,
    node_after: initialState.active_node,
    status_after: initialState.status,
    input_type: "SYSTEM_INIT",
    transition_type: "INIT",
  })

  // Auto-advance lobby through TOOL/CHECKPOINT/ROUTER nodes so the user lands on a usable prompt.
  const advanced = await runTurnWithAutoAdvance({
    baseState: initialState,
    input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
    userKey,
  })

  await persistState(advanced)

  // Canonical events (V1): represent the resulting applied transition and rendered node after auto-advance.
  await emitCanonicalEvent({
    userKey,
    conversationId: advanced.state.conversation_id,
    revision: advanced.state.revision,
    inputId: advanced.state.revision,
    nodeId: advanced.state.active_node,
    eventType: "transition_applied",
    payload: {
      input_type: "SYSTEM_INIT",
      transition: {
        type: advanced.transition.type,
        from: advanced.transition.from,
        to: advanced.transition.to ?? null,
        reason: advanced.transition.reason,
        meta_keys_written: advanced.transition.meta_delta ? Object.keys(advanced.transition.meta_delta) : [],
      },
      status_after: advanced.state.status,
    },
  })

  await emitCanonicalEvent({
    userKey,
    conversationId: advanced.state.conversation_id,
    revision: advanced.state.revision,
    inputId: advanced.state.revision,
    nodeId: advanced.state.active_node,
    eventType: "node_rendered",
    payload: {
      node_id: advanced.state.active_node,
      message: truncateText(advanced.state.active_node_message ?? "", 800),
      status: advanced.state.status,
    },
  })

  res.status(200).json(advanced)
  return true
}

function resolveBaseState(params: { storedState: any | null; clientState: any }): any {
  return params.storedState ?? params.clientState
}

async function runTurnWithAutoAdvance(params: {
  baseState: any
  input: InputSignal
  userKey: string
}): Promise<KernelResult> {
  const { baseState, input, userKey } = params

  let kernelResult = await runNode({ state: baseState, input, userKey })

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now()
  const body = validateRequest(req, res)
  if (!body) return

  const userKey = ensureUserKey(req, res)
  const lobbyConversationId = toLobbyConversationId(userKey)

  const { state: clientState, input } = body

  // Init always enters the lobby, not a specific thread.
  if (clientState === null) {
    const storedLobby = await readConversationState(lobbyConversationId)
    const initHandled = await handleInitOrRestore({
      clientState,
      storedState: storedLobby,
      conversationId: lobbyConversationId,
      userKey,
      res,
    })
    if (initHandled) return
    return
  }

  const conversationId =
    typeof clientState?.conversation_id === "string" ? clientState.conversation_id : lobbyConversationId
  const stored = await readConversationState(conversationId)

  const baseState = resolveBaseState({ storedState: stored, clientState })

  try {
    const kernelResult = await runTurnWithAutoAdvance({ baseState, input, userKey })
    await persistState(kernelResult)

    // Canonical events (V1)
    const assistantText =
      kernelResult.transition.response_message ?? kernelResult.state.active_node_message

    const rawUserText = (input as any).type === "FREE_TEXT" ? String((input as any).text ?? "") : toUserInput(input) ?? ""

    await emitCanonicalEvent({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      revision: kernelResult.state.revision,
      inputId: kernelResult.state.revision,
      nodeId: kernelResult.log.active_node_before ?? (baseState?.active_node ?? null),
      eventType: "input_received",
      payload: {
        input_type: (input as any).type,
        // Raw text is disabled by default; enable via GAARSDAL_EVENTS_INCLUDE_TEXT=1 for local/dev.
        user_input: shouldIncludeRawText() ? truncateText(rawUserText, 1200) : undefined,
        user_input_length: rawUserText.length,
      },
    })

    await emitCanonicalEvent({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      revision: kernelResult.state.revision,
      inputId: kernelResult.state.revision,
      nodeId: kernelResult.state.active_node,
      eventType: "transition_applied",
      payload: {
        input_type: (input as any).type,
        transition: {
          type: kernelResult.transition.type,
          from: kernelResult.transition.from,
          to: kernelResult.transition.to ?? null,
          reason: kernelResult.transition.reason,
          meta_keys_written: kernelResult.transition.meta_delta ? Object.keys(kernelResult.transition.meta_delta) : [],
        },
        status_after: kernelResult.state.status,
      },
    })

    const activeNode = getNode(kernelResult.state.active_node)

    await emitCanonicalEvent({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      revision: kernelResult.state.revision,
      inputId: kernelResult.state.revision,
      nodeId: kernelResult.state.active_node,
      eventType: "node_rendered",
      payload: {
        node_id: kernelResult.state.active_node,
        node_kind: (activeNode as any)?.kind ?? null,
        capability_id: (activeNode as any)?.kind === "DIALOG" ? (activeNode as any)?.capability_id ?? null : null,
        tool_id: (activeNode as any)?.kind === "TOOL" ? (activeNode as any)?.tool?.tool_id ?? null : null,
        message: truncateText(assistantText ?? "", 800),
        ai_output_length: (assistantText ?? "").length,
        status: kernelResult.state.status,
      },
    })

    // Terminal events: emit only on status change (no inference).
    const prevStatus = typeof baseState?.status === "string" ? baseState.status : null
    if (prevStatus !== kernelResult.state.status) {
      if (kernelResult.state.status === "completed") {
        await emitCanonicalEvent({
          userKey,
          conversationId: kernelResult.state.conversation_id,
          revision: kernelResult.state.revision,
          inputId: kernelResult.state.revision,
          nodeId: kernelResult.state.active_node,
          eventType: "conversation_completed",
          payload: {
            terminal_revision: kernelResult.state.revision,
            terminal_node: kernelResult.state.active_node,
          },
        })
      }
      if (kernelResult.state.status === "rejected") {
        await emitCanonicalEvent({
          userKey,
          conversationId: kernelResult.state.conversation_id,
          revision: kernelResult.state.revision,
          inputId: kernelResult.state.revision,
          nodeId: kernelResult.state.active_node,
          eventType: "conversation_rejected",
          payload: {
            terminal_revision: kernelResult.state.revision,
            terminal_node: kernelResult.state.active_node,
          },
        })
      }
    }

    await maybeAutoLabelThread({
      userKey,
      conversationId: kernelResult.state.conversation_id,
      input,
      revisionAfter: kernelResult.state.revision,
    })

    const metaKeysWritten = kernelResult.transition.meta_delta ? Object.keys(kernelResult.transition.meta_delta) : []

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
      userText: (input as any).type === "FREE_TEXT" ? (input as any).text : undefined,
    })

    res.status(200).json(kernelResult)
  } catch (e: any) {
    await appendSpineEventV23({
      schema_version: "v23",
      event_id: eventId(),
      user_key: userKey,
      conversation_id: conversationId,
      revision_before: stored?.revision ?? -1,
      revision_after: stored?.revision ?? -1,
      node_before: stored?.active_node ?? null,
      node_after: stored?.active_node ?? (clientState?.active_node ?? "UNKNOWN"),
      status_after: stored?.status ?? "active",
      input_type: (input as any).type,
      transition_type: "ERROR",
      latency_ms: Date.now() - started,
      error: {
        code: "UNHANDLED",
        message: typeof e?.message === "string" ? e.message : "Unknown error",
      },
    })

    // Canonical event (V1): error
    await emitCanonicalEvent({
      userKey,
      conversationId,
      revision: stored?.revision ?? -1,
      inputId: stored?.revision ?? -1,
      nodeId: stored?.active_node ?? null,
      eventType: "error_raised",
      payload: {
        code: "UNHANDLED",
        message: typeof e?.message === "string" ? e.message : "Unknown error",
        stage: "runtime",
        input_type: (input as any).type,
      },
    })

    res.status(500).json({ error: "Internal Server Error" })
  }
}
