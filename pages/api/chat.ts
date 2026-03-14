// pages/api/chat.ts
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
import { readConversationState, writeConversationState } from "../../chat/persistence/conversationStateStore"
import {
  applyAutoThreadLabelFromText,
  archiveThread,
  ensureThreadIndex,
  setActiveThread,
  upsertThread,
  writeThreadIndex,
} from "../../chat/persistence/threadIndexStore"
import { appendSpineEventV23 } from "../../chat/observability/spineStore"
import { appendConversationEventV1 } from "../../chat/events/store"

import { ensureThreadThemeAndEpisode } from "../../chat/memory/longTermMemoryStore"
import { enqueueJob, makeJobId } from "../../chat/async/queue"
import { runReflectionCbaUpdate } from "../../chat/reflection/cba"
import { jobsTtlSeconds, triggerJob } from "../../chat/jobs/store"
import type { DeferredJobSignal, ProblemSpecV1 } from "../../chat/jobs/types"

// Single raw stream
import { appendRawTurn, readRawTurns } from "../../chat/raw/store"

type ChatRequestBody = {
  state: any
  input: ApiInputSignal
}

type ApiInputSignal =
  | InputSignal
  | {
      type: "THREAD_CREATE"
      mode: "normal" | "parenthesis"
    }
  | { type: "THREAD_SWITCH"; conversation_id: string }
  | { type: "THREAD_ARCHIVE" }

type UiSuggestion = {
  id: string
  label: string
  input?: any
}

const COOKIE_NAME = "gaarsdal_uid"
const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days
const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days
const PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60 // 90 days

function setCors(req: NextApiRequest, res: NextApiResponse) {
  // The widget can be embedded on other origins. If that happens, browsers will send
  // an OPTIONS preflight for JSON POST requests. We must respond to OPTIONS.
  //
  // Because we rely on a cookie for user identity, we must echo the Origin when present.
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "*"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Allow-Credentials", "true")
}

// Defaults
const DEFAULT_RAW_TTL_DAYS = 14

function envInt(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number.parseInt(v.trim(), 10)
  return Number.isFinite(n) ? n : fallback
}

function rawTtlSeconds(): number {
  return envInt("GAARSDAL_RAW_TTL_DAYS", DEFAULT_RAW_TTL_DAYS) * 24 * 60 * 60
}

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
  if (input.type === "UI_ACTION") return `UI_ACTION:${(input as any).action}`
  if (input.type === "SYSTEM") return `SYSTEM:${(input as any).intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

function safeUuid(): string {
  // Node 18+ has crypto.randomUUID; fallback for older runtimes.
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
}

function withThreadNavMeta(state: any, returnDepth: number): any {
  return {
    ...state,
    meta: {
      ...(state?.meta ?? {}),
      "threads.return_depth": { value: returnDepth, source_node: "SYSTEM_UI" },
    },
  }
}

type ThreadTab = {
  conversation_id: string
  title: string
  preview: string
  status: "active" | "archived"
  updated_at?: string
}

function makeThreadTabs(index: any): ThreadTab[] {
  const threads = Array.isArray(index?.threads) ? index.threads : []
  return threads
    .filter((t: any) => t && typeof t.conversation_id === "string" && (t.status === "active" || t.status === "archived"))
    .map((t: any) => ({
      conversation_id: t.conversation_id,
      title: typeof t.title === "string" ? t.title : "",
      preview: typeof t.preview === "string" ? t.preview : "",
      status: t.status === "archived" ? "archived" : "active",
      updated_at: t.updated_at,
    }))
}

function withThreadMeta(params: { state: any; index: any }): any {
  const { state, index } = params
  const tabs = makeThreadTabs(index).filter((t) => t.status === "active")
  const activeId = (typeof index?.active_conversation_id === "string" ? index.active_conversation_id : state?.conversation_id) ?? null

  return {
    ...state,
    meta: {
      ...(state?.meta ?? {}),
      "threads.tabs": { value: tabs, source_node: "SYSTEM_UI" },
      "threads.active_id": { value: activeId, source_node: "SYSTEM_UI" },
    },
  }
}

function isPlatformThreadInput(input: ApiInputSignal): input is Exclude<ApiInputSignal, InputSignal> {
  return (
    (input as any)?.type === "THREAD_CREATE" ||
    (input as any)?.type === "THREAD_SWITCH" ||
    (input as any)?.type === "THREAD_ARCHIVE"
  )
}

function eventId(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
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

function legacyRawLogsEnabled(): boolean {
  // When true, keep writing raw text into legacy interaction/telemetry/memory logs.
  // Default is false to honor single raw stream + TTL.
  return envTrue("GAARSDAL_LEGACY_RAW_LOGS")
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

function deriveUiSuggestionsFromState(state: any): UiSuggestion[] {
  const meta = state?.meta && typeof state.meta === "object" ? state.meta : {}
  const render = (meta?.["triage.render"] as any)?.value
  const chips = (render && Array.isArray(render.chips) ? render.chips : (meta?.["triage.chips"] as any)?.value) as any
  if (!Array.isArray(chips)) return []

  return chips
    .filter((c) => c && typeof c === "object" && typeof (c as any).label === "string")
    .slice(0, 8)
    .map((c, i) => {
      const label = String((c as any).label)
      return {
        id: String((c as any).id ?? i),
        label,
        // Default behavior: chips send FREE_TEXT with the label (the runtime already resolves intent).
        input: { type: "FREE_TEXT", text: label },
      }
    })
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
  const needsTitle = !existing || !existing.title?.trim()

  // Ensure thread exists in index (covers restores or direct navigation).
  let index1 = upsertThread({ index: index0, conversationId: params.conversationId })

  // Title text is derived from the FIRST user input in the thread.
  const titleText = await (async () => {
    if (!needsTitle) return ""
    const rawTurns = await readRawTurns({ conversationId: params.conversationId, limit: 500 })
    const firstUser = rawTurns.find((t) => t && t.input_type === "FREE_TEXT" && typeof t.user_input === "string")
    const firstText = String(firstUser?.user_input ?? "").trim()
    if (firstText && !isControlInput(firstText)) return firstText
    return userText
  })()

  index1 = applyAutoThreadLabelFromText({
    index: index1,
    conversationId: params.conversationId,
    titleText,
    previewText: userText,
    maxTitleChars: 60,
    maxPreviewChars: 120,
    setTitleIfEmpty: true,
    alwaysUpdatePreview: true,
  })

  index1 = setActiveThread({ index: index1, conversationId: params.conversationId })

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
  threadThemeId?: string
  threadEpisodeId?: string
}): Promise<void> {
  const N = 8
  if (params.revisionAfter <= 0) return
  if (params.revisionAfter % N !== 0) return

  const themeId = params.threadThemeId
  const episodeId = params.threadEpisodeId
  if (typeof themeId !== "string" || typeof episodeId !== "string") return

  const job_id = makeJobId({
    type: "SUMMARIZE_EPISODE",
    userKey: params.userKey,
    episodeId,
    revisionAfter: params.revisionAfter,
  })

  await enqueueJob({
    schema_version: "v23",
    job_version: 1,
    type: "SUMMARIZE_EPISODE",
    job_id,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    theme_id: themeId,
    episode_id: episodeId,
    revision_after: params.revisionAfter,
  })
}

async function enqueueSuggestFacts(params: {
  userKey: string
  conversationId: string
  revisionAfter: number
  metaKeysWritten: string[]
  threadThemeId?: string
  threadEpisodeId?: string
}): Promise<void> {
  // Trigger rule (v23):
  // - when triage.* OR memory_candidates.* writes occur, enqueue; otherwise no-op.
  const touched = params.metaKeysWritten.some((k) => k.startsWith("triage.") || k.startsWith("memory_candidates."))
  if (!touched) return

  const themeId = params.threadThemeId
  const episodeId = params.threadEpisodeId
  if (typeof themeId !== "string" || typeof episodeId !== "string") return

  const job_id = makeJobId({
    type: "SUGGEST_FACTS",
    userKey: params.userKey,
    episodeId,
    revisionAfter: params.revisionAfter,
  })

  await enqueueJob({
    schema_version: "v23",
    job_version: 1,
    type: "SUGGEST_FACTS",
    job_id,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    theme_id: themeId,
    episode_id: episodeId,
    revision_after: params.revisionAfter,
  })
}

async function enqueueReflectionCbaUpdate(params: {
  userKey: string
  conversationId: string
  revisionAfter: number
  activeNodeAfter: string
  userMessage: string
  therapistMessage: string
  threadThemeId?: string
  threadEpisodeId?: string
}): Promise<void> {
  // Only runs when a REFLECTION node is active.
  if (params.activeNodeAfter !== "REFLECTION") return

  const userMessage = (params.userMessage ?? "").trim()
  const therapistMessage = (params.therapistMessage ?? "").trim()
  if (!userMessage && !therapistMessage) return

  const themeId = params.threadThemeId
  const episodeId = params.threadEpisodeId
  if (typeof themeId !== "string" || typeof episodeId !== "string") return

  const job_id = makeJobId({
    type: "REFLECTION_CBA_UPDATE",
    userKey: params.userKey,
    episodeId,
    revisionAfter: params.revisionAfter,
  })

  await enqueueJob({
    schema_version: "v23",
    job_version: 1,
    type: "REFLECTION_CBA_UPDATE",
    job_id,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    theme_id: themeId,
    episode_id: episodeId,
    revision_after: params.revisionAfter,
    payload: {
      user_message: userMessage,
      therapist_message: therapistMessage,
    },
  })
}

async function ensureThreadBindingOnState(params: {
  userKey: string
  conversationId: string
  state: any
}): Promise<{ state: any; themeId: string; episodeId: string } | null> {
  const meta = params.state?.meta && typeof params.state.meta === "object" ? params.state.meta : {}
  const existingThemeId = (meta?.["thread.theme_id"] as any)?.value
  const existingEpisodeId = (meta?.["thread.episode_id"] as any)?.value

  if (typeof existingThemeId === "string" && typeof existingEpisodeId === "string") {
    return { state: params.state, themeId: existingThemeId, episodeId: existingEpisodeId }
  }

  const ensured = await ensureThreadThemeAndEpisode({
    userKey: params.userKey,
    conversationId: params.conversationId,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })

  const nextMeta = {
    ...meta,
    "thread.theme_id": { value: ensured.theme.theme_id, source_node: "SYSTEM_THREAD_BINDING" },
    "thread.episode_id": { value: ensured.episode.episode_id, source_node: "SYSTEM_THREAD_BINDING" },
  }

  const nextState = { ...params.state, meta: nextMeta }
  return { state: nextState, themeId: ensured.theme.theme_id, episodeId: ensured.episode.episode_id }
}

async function logAndRecord(params: {
  userKey: string
  input: InputSignal
  kernelResult: KernelResult
  userText?: string
}): Promise<void> {
  const { kernelResult, input } = params

  const assistantText = kernelResult.transition.response_message ?? kernelResult.state.active_node_message

  // Raw text goes into exactly one place (TTL).
  await appendRawTurn({
    conversationId: kernelResult.state.conversation_id,
    revision: kernelResult.state.revision,
    nodeId: kernelResult.state.active_node,
    inputType: (input as any).type,
    userInput: params.userText ?? toUserInput(input),
    assistantOutput: assistantText,
    ttlSeconds: rawTtlSeconds(),
  })

  // Always keep kernel log.
  await appendLog(kernelResult.log)

  const includeLegacyRaw = legacyRawLogsEnabled()

  // Interaction log: keep minimal event; only include raw text if legacy enabled.
  if (includeLegacyRaw) {
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
  } else {
    await appendInteraction({
      conversation_id: kernelResult.state.conversation_id,
      revision: kernelResult.state.revision,
      active_node: kernelResult.state.active_node,
      input_type: (input as any).type,
      outcome_node: kernelResult.transition.to,
      timestamp: new Date().toISOString(),
    })
  }

  // Memory events: includeText is controlled by legacy flag.
  await recordTurn({
    userKey: params.userKey,
    conversationId: kernelResult.state.conversation_id,
    state: kernelResult.state,
    userText: params.userText,
    assistantText,
    transitionType: kernelResult.transition.type,
    includeText: includeLegacyRaw,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })

  const activeNode = getNode(kernelResult.state.active_node)
  await appendTelemetryTurn({
    conversation_id: kernelResult.state.conversation_id,
    user_key: params.userKey,
    revision: kernelResult.state.revision,
    node_id: kernelResult.state.active_node,
    input_type: (input as any).type,
    user_input_raw: includeLegacyRaw ? params.userText ?? toUserInput(input) : undefined,
    assistant_output_raw: includeLegacyRaw ? assistantText : undefined,
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
  setCors(req, res)

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return null
  }

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
  conversationKind: "lobby" | "thread"
  userKey: string
  res: NextApiResponse
}): Promise<boolean> {
  const { clientState, storedState, conversationId, conversationKind, userKey, res } = params
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

    // Only auto-advance the lobby. Auto-ticking an arbitrary thread can lead to
    // unexpected transitions (or hangs) when restoring after browser navigation.
    let result: KernelResult
    if (conversationKind === "lobby") {
      result = await runTurnWithAutoAdvance({
        baseState: payload.state,
        input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
        userKey,
      })
      await persistState(result)
    } else {
      result = {
        state: payload.state,
        transition: {
          type: "INIT",
          from: null,
          to: payload.state.active_node,
          reason: "system init (restored)",
        },
      } as any
    }

    // Canonical events (V1)
    await emitCanonicalEvent({
      userKey,
      conversationId: result.state.conversation_id,
      revision: result.state.revision,
      inputId: result.state.revision,
      nodeId: result.state.active_node,
      eventType: "transition_applied",
      payload: {
        input_type: "SYSTEM_INIT",
        transition: {
          type: (result as any).transition?.type ?? "INIT",
          from: (result as any).transition?.from ?? null,
          to: (result as any).transition?.to ?? result.state.active_node,
          reason: (result as any).transition?.reason ?? "system init",
          meta_keys_written: (result as any).transition?.meta_delta ? Object.keys((result as any).transition.meta_delta) : [],
        },
        status_after: result.state.status,
      },
    })

    await emitCanonicalEvent({
      userKey,
      conversationId: result.state.conversation_id,
      revision: result.state.revision,
      inputId: result.state.revision,
      nodeId: result.state.active_node,
      eventType: "node_rendered",
      payload: {
        node_id: result.state.active_node,
        message: truncateText(result.state.active_node_message ?? "", 800),
        status: result.state.status,
      },
    })

    const indexNow = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
    res.status(200).json({
      ...(result as any),
      state: withThreadMeta({ state: result.state, index: indexNow }),
    })
    return true
  }

  const initialState =
    conversationKind === "lobby" ? createLobbyState(conversationId) : createInitialState(conversationId)

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

  let result: KernelResult
  if (conversationKind === "lobby") {
    result = await runTurnWithAutoAdvance({
      baseState: initialState,
      input: { type: "SYSTEM", intent: "AUTO_TICK" } as any,
      userKey,
    })
    await persistState(result)
  } else {
    result = {
      state: initialState,
      transition: { type: "INIT", from: null, to: initialState.active_node, reason: "system init" },
    } as any
  }

  await emitCanonicalEvent({
    userKey,
    conversationId: result.state.conversation_id,
    revision: result.state.revision,
    inputId: result.state.revision,
    nodeId: result.state.active_node,
    eventType: "transition_applied",
    payload: {
      input_type: "SYSTEM_INIT",
      transition: {
        type: (result as any).transition?.type ?? "INIT",
        from: (result as any).transition?.from ?? null,
        to: (result as any).transition?.to ?? result.state.active_node,
        reason: (result as any).transition?.reason ?? "system init",
        meta_keys_written: (result as any).transition?.meta_delta ? Object.keys((result as any).transition.meta_delta) : [],
      },
      status_after: result.state.status,
    },
  })

  await emitCanonicalEvent({
    userKey,
    conversationId: result.state.conversation_id,
    revision: result.state.revision,
    inputId: result.state.revision,
    nodeId: result.state.active_node,
    eventType: "node_rendered",
    payload: {
      node_id: result.state.active_node,
      message: truncateText(result.state.active_node_message ?? "", 800),
      status: result.state.status,
    },
  })

    const indexNow = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

    res.status(200).json({
    ...(result as any),
    state: withThreadMeta({ state: result.state, index: indexNow }),
  })
  return true
}

function resolveBaseState(params: { storedState: any | null; clientState: any }): any {
  return params.storedState ?? params.clientState
}

async function runTurnWithAutoAdvance(params: { baseState: any; input: InputSignal; userKey: string }): Promise<KernelResult> {
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

function readMetaValue(state: any, key: string): unknown {
  const entry = state?.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
  return entry
}

function toStringArray(value: unknown, max = 3): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max)
}

function looksLikeHistoryReuseRequest(text: string): boolean {
  const s = text.trim().toLowerCase()
  if (!s) return false

  const explicitCrossThreadScan = /(scan|scann|gennemgå|gennemgaa|tjek|find|søg|soeg|kig i|se i).*(på tværs af|paa tvaers af|tidligere|forrige|gamle|historik|forløb|forloeb|andre).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s)
    || /(på tværs af|paa tvaers af).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s)

  const explicitHistoryReuse = /(tjek|gennemgå|gennemgaa|scan|scann|søg|soeg|find|brug|genbrug|se i|kig i)/.test(s)
    && (/(tidligere|forrige|gamle|historik|forløb|forloeb).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s)
      || /(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger).*(tidligere|forrige|gamle|historik|forløb|forloeb)/.test(s)
      || /(andre).*(samtaler|dialoger|tråde|traade)/.test(s))

  const retrospectiveQuestion = /(har|hvad|ved du om).*(jeg|vi).*(talt om|nævnt|naevnt|været inde på|vaeret inde paa|fortalt).*(før|foer|tidligere)/.test(s)
    || /(har|hvad|ved du om).*(jeg|vi).*(talt om|nævnt|naevnt|været inde på|vaeret inde paa|fortalt).*(i andre samtaler|i andre tråde|i andre traade)/.test(s)

  return explicitCrossThreadScan || explicitHistoryReuse || retrospectiveQuestion
}

function buildProblemSpecFromGenHypno(state: any): ProblemSpecV1 | null {
  const problemTitleRaw = readMetaValue(state, "gen_hypno.problem_title")
  const problemSummaryRaw = readMetaValue(state, "gen_hypno.problem_summary")
  const lastTopicRaw = readMetaValue(state, "gen_hypno.last_topic")
  const topicTagsRaw = readMetaValue(state, "gen_hypno.topic_tags")

  const problemTitle = typeof problemTitleRaw === "string" ? problemTitleRaw.trim() : ""
  const problemSummary = typeof problemSummaryRaw === "string" ? problemSummaryRaw.trim() : ""
  const lastTopic = typeof lastTopicRaw === "string" ? lastTopicRaw.trim() : ""
  const topicTags = toStringArray(topicTagsRaw, 3)

  const finalTitle = problemTitle || lastTopic
  const finalSummary = problemSummary || (lastTopic ? `Aktuelt tema: ${lastTopic}.` : "")

  if (!finalTitle || !finalSummary) return null

  return {
    schema_version: "v1",
    problem_title: finalTitle,
    problem_description: finalSummary,
    topic_tags: topicTags.length ? topicTags : lastTopic ? [lastTopic] : undefined,
    time_scope: "all_history",
    search_intent: "find relevant prior context for current thread",
    confidence: 0.7,
  }
}

function currentUserTurnCount(state: any): number {
  const assistantTurnCountRaw = readMetaValue(state, "gen_hypno.assistant_turn_count")
  const transcriptRaw = readMetaValue(state, "gen_hypno.transcript")

  if (typeof assistantTurnCountRaw === "number" && Number.isFinite(assistantTurnCountRaw)) {
    return Math.max(0, Math.trunc(assistantTurnCountRaw))
  }

  if (Array.isArray(transcriptRaw)) {
    const assistantTurns = transcriptRaw.filter((item) => item && typeof item === "object" && (item as any).role === "assistant").length
    return Math.max(0, assistantTurns)
  }

  return 0
}

function seemsHistoryRelevant(problem: ProblemSpecV1 | null, userText: string): boolean {
  if (!problem) return false
  const title = String(problem.problem_title ?? "").trim()
  const description = String(problem.problem_description ?? "").trim()
  const tags = Array.isArray(problem.topic_tags) ? problem.topic_tags.filter(Boolean) : []
  const text = `${title} ${description} ${userText}`.toLowerCase()

  if (title.length >= 4 && description.length >= 18) return true
  if (tags.length >= 1 && description.length >= 12) return true

  return /(angst|uro|stress|søvn|soevn|alkohol|misbrug|træt|traet|depression|bekymring|relation|flyskræk|flyskraek)/i.test(text)
}

function shouldAutoTriggerHistoryScan(params: { state: any; problem: ProblemSpecV1 | null; userText: string }): { shouldTrigger: boolean; turnCount: number } {
  const turnCount = currentUserTurnCount(params.state)
  if (turnCount < 2) return { shouldTrigger: false, turnCount }
  const onCadence = turnCount === 2 || (turnCount > 2 && (turnCount - 2) % 4 === 0)
  if (!onCadence) return { shouldTrigger: false, turnCount }
  if (!seemsHistoryRelevant(params.problem, params.userText)) return { shouldTrigger: false, turnCount }
  return { shouldTrigger: true, turnCount }
}

async function maybeTriggerScanThreadsJob(params: {
  userKey: string
  input: InputSignal
  conversationId: string
  kernelResult: KernelResult
}): Promise<{ kernelResult: KernelResult; jobTriggered: boolean; deferredJob?: DeferredJobSignal<"scan_threads"> }> {
  const { userKey, input, conversationId } = params
  let kernelResult = params.kernelResult

  if ((input as any)?.type !== "FREE_TEXT") return { kernelResult, jobTriggered: false }
  if (isLobbyConversation(conversationId)) return { kernelResult, jobTriggered: false }

  const userText = String((input as any).text ?? "")
  const explicitRequest = looksLikeHistoryReuseRequest(userText)
  const problem = buildProblemSpecFromGenHypno(kernelResult.state)
  const autoDecision = shouldAutoTriggerHistoryScan({ state: kernelResult.state, problem, userText })

  if (!explicitRequest && !autoDecision.shouldTrigger) return { kernelResult, jobTriggered: false }

  if (!problem) {
    if (!explicitRequest) return { kernelResult, jobTriggered: false }
    kernelResult = {
      ...kernelResult,
      transition: {
        ...kernelResult.transition,
        response_message:
          "Jeg mangler først en kort problemformulering i denne tråd, før jeg kan scanne tidligere tråde. Beskriv kort problemet, og bed mig derefter om at tjekke tidligere forløb.",
      },
    }
    return { kernelResult, jobTriggered: false }
  }

  const basedOnRevision = typeof kernelResult.state?.revision === "number" ? kernelResult.state.revision : 0
  const scanReason = explicitRequest ? "explicit" : "auto"
  const triggerTurn = autoDecision.turnCount || currentUserTurnCount(kernelResult.state)

  const { jobId, deduped } = await triggerJob({
    userKey,
    conversationId,
    kind: "scan_threads",
    payload: { problem, scan_reason: scanReason, trigger_turn: triggerTurn },
    ttlSeconds: jobsTtlSeconds(),
    dedupe: true,
    basedOnRevision,
    mode: "shadow",
  })

  if (!jobId) return { kernelResult, jobTriggered: false }

  if (explicitRequest) {
    const message = deduped
      ? "Jeg har allerede en scanning af tidligere tråde i gang for denne tråd. Jeg viser et forslag, når det er klar."
      : "Jeg scanner nu tidligere tråde for relevant historik. Når scanningen er færdig, får du et forslag, som du kan acceptere eller rette."

    kernelResult = {
      ...kernelResult,
      transition: {
        ...kernelResult.transition,
        response_message: message,
      },
    }
  }

  return {
    kernelResult,
    jobTriggered: true,
    deferredJob: {
      pending: true,
      job_id: jobId,
      kind: "scan_threads",
      mode: "shadow",
      based_on_revision: basedOnRevision,
    },
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const started = Date.now()
  const body = validateRequest(req, res)
  if (!body) return

  const userKey = ensureUserKey(req, res)
  const lobbyConversationId = toLobbyConversationId(userKey)

  const { state: clientState, input } = body

  // Init (tabs model): always restore the active thread if possible.
  // If no active thread exists, create a new one and make it active.
  if (clientState === null) {
    const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

    // Pick active thread if present and active; else pick first active thread; else create a new one.
    let activeId = index0.active_conversation_id
    const activeThreads = (index0.threads ?? []).filter((t: any) => t && t.status === "active")

    if (typeof activeId !== "string" || !activeThreads.some((t: any) => t.conversation_id === activeId)) {
      activeId = activeThreads.length ? activeThreads[0].conversation_id : null
    }

    // Create first thread if none exist.
    if (!activeId) {
      const newConversationId = `c:${safeUuid()}`
      const newState = createInitialState(newConversationId)
      await writeConversationState(newState, SESSION_TTL_SECONDS)

      let nextIndex = upsertThread({ index: index0, conversationId: newConversationId, title: "", preview: "" })
      nextIndex = setActiveThread({ index: nextIndex, conversationId: newConversationId })
      await writeThreadIndex({ userKey, index: nextIndex, ttlSeconds: PROFILE_TTL_SECONDS })

      res.status(200).json({
        state: withThreadMeta({ state: newState, index: nextIndex }),
      })
      return
    }

    // Ensure thread index points to the active id.
    if (typeof activeId === "string" && index0.active_conversation_id !== activeId) {
      const nextIndex = setActiveThread({ index: index0, conversationId: activeId })
      await writeThreadIndex({ userKey, index: nextIndex, ttlSeconds: PROFILE_TTL_SECONDS })
    }

    const storedInit = await readConversationState(activeId as string)
    const initHandled = await handleInitOrRestore({
      clientState,
      storedState: storedInit,
      conversationId: activeId as string,
      conversationKind: "thread",
      userKey,
      res,
    })
    if (initHandled) return
    return
  }

  const conversationId =
    typeof clientState?.conversation_id === "string" ? clientState.conversation_id : lobbyConversationId
  const stored = await readConversationState(conversationId)

  let baseState = resolveBaseState({ storedState: stored, clientState })

  // Cross-thread contamination guardrail:
  // Ensure every non-lobby conversation has a stable thread→theme/episode binding.
  let threadBinding: { themeId: string; episodeId: string } | null = null
  if (conversationId !== lobbyConversationId) {
    const ensured = await ensureThreadBindingOnState({
      userKey,
      conversationId,
      state: baseState,
    })
    if (ensured) {
      baseState = ensured.state
      threadBinding = { themeId: ensured.themeId, episodeId: ensured.episodeId }
    }
  }

  // Platform-level thread navigation (explicit user actions only).
  if (isPlatformThreadInput(input)) {
    const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

    if (input.type === "THREAD_ARCHIVE") {
      const threadId = typeof baseState?.conversation_id === "string" ? baseState.conversation_id : null

      // Only archive real threads, never the lobby.
      if (!threadId || isLobbyConversation(threadId)) {
        res.status(200).json({
          state: withThreadMeta({
            state: {
              ...baseState,
              meta: {
                ...(baseState?.meta ?? {}),
                "ui.suggestions": { value: [], source_node: "SYSTEM_UI" },
              },
            },
            index: index0,
          }),
        })
        return
      }
      const nextIndex0 = archiveThread({ index: index0, conversationId: threadId })
            let nextIndex = nextIndex0
      
            // Pick next active thread after archiving.
            let nextActiveId = nextIndex.active_conversation_id
            const activeThreads = (nextIndex.threads ?? []).filter((t: any) => t && t.status === "active")
            if (typeof nextActiveId !== "string" || !activeThreads.some((t: any) => t.conversation_id === nextActiveId)) {
              nextActiveId = activeThreads.length ? activeThreads[0].conversation_id : null
            }
      
            if (!nextActiveId) {
              const newConversationId = `c:${safeUuid()}`
              const newState = createInitialState(newConversationId)
              await writeConversationState(newState, SESSION_TTL_SECONDS)
              nextIndex = upsertThread({ index: nextIndex, conversationId: newConversationId, title: "", preview: "" })
              nextIndex = setActiveThread({ index: nextIndex, conversationId: newConversationId })
              await writeThreadIndex({ userKey, index: nextIndex, ttlSeconds: PROFILE_TTL_SECONDS })
      
              res.status(200).json({
                state: withThreadMeta({
                  state: {
                    ...newState,
                    meta: {
                      ...(newState.meta ?? {}),
                      "ui.suggestions": { value: [], source_node: "SYSTEM_UI" },
                    },
                  },
                  index: nextIndex,
                }),
              })
              return
            }
      
            nextIndex = setActiveThread({ index: nextIndex, conversationId: nextActiveId as string })
            await writeThreadIndex({ userKey, index: nextIndex, ttlSeconds: PROFILE_TTL_SECONDS })
      
            const loaded = await readConversationState(nextActiveId as string)
            const ensured = loaded ?? createInitialState(nextActiveId as string)
            if (!loaded) {
              await writeConversationState(ensured, SESSION_TTL_SECONDS)
            }
      
            res.status(200).json({
              state: withThreadMeta({
                state: {
                  ...ensured,
                  meta: {
                    ...(ensured.meta ?? {}),
                    "ui.suggestions": { value: [], source_node: "SYSTEM_UI" },
                  },
                },
                index: nextIndex,
              }),
            })
            return
    }

    if (input.type === "THREAD_CREATE") {
      const oldThreadId = typeof baseState?.conversation_id === "string" ? baseState.conversation_id : null
      const canReturn = !!oldThreadId && !isLobbyConversation(oldThreadId)

      const newConversationId = `c:${safeUuid()}`
      const newState = createInitialState(newConversationId)

      await writeConversationState(newState, SESSION_TTL_SECONDS)

      let nextIndex = upsertThread({
        index: index0,
        conversationId: newConversationId,
        title: "",
        preview: "",
      })

      if (input.mode === "normal") {
        nextIndex = { ...nextIndex, navigation: { return_stack: [] } }
      } else {
        const stack = [...(nextIndex.navigation?.return_stack ?? [])]
        if (canReturn) {
          stack.push({
            from: oldThreadId as string,
            to: newConversationId,
            created_at: new Date().toISOString(),
            reason: "parenthesis",
          })
        }
        nextIndex = { ...nextIndex, navigation: { return_stack: stack } }
      }

      nextIndex = setActiveThread({ index: nextIndex, conversationId: newConversationId })
      await writeThreadIndex({ userKey, index: nextIndex, ttlSeconds: PROFILE_TTL_SECONDS })

      res.status(200).json({
        state: withThreadMeta({
          state: {
            ...newState,
            meta: {
              ...(newState.meta ?? {}),
              "ui.suggestions": { value: [], source_node: "SYSTEM_UI" },
            },
          },
          index: nextIndex,
        }),
      })
      return
    }


    if (input.type === "THREAD_SWITCH") {
      const targetConversationId = typeof (input as any)?.conversation_id === "string" ? (input as any).conversation_id : null
      if (!targetConversationId || isLobbyConversation(targetConversationId)) {
        const indexNow = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
        res.status(200).json({ state: withThreadMeta({ state: baseState, index: indexNow }) })
        return
      }

      const index1 = setActiveThread({ index: index0, conversationId: targetConversationId })
      await writeThreadIndex({ userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })

      const loaded = await readConversationState(targetConversationId)
      const ensured = loaded ?? createInitialState(targetConversationId)
      if (!loaded) {
        await writeConversationState(ensured, SESSION_TTL_SECONDS)
      }

      res.status(200).json({ state: withThreadMeta({ state: ensured, index: index1 }) })
      return
    }

  }

  try {
    const kernelResult0 = await runTurnWithAutoAdvance({ baseState, input: input as InputSignal, userKey })

    // UI suggestions are server-controlled to avoid hardcoded/meaningless chips in the client.
    const uiSuggestions =
      kernelResult0.state?.active_node === "TRIAGE" ? deriveUiSuggestionsFromState(kernelResult0.state) : []

    const indexForUi = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
    const returnDepth = indexForUi.navigation?.return_stack?.length ?? 0

    const kernelResult: KernelResult = {
      ...kernelResult0,
      state: {
        ...kernelResult0.state,
        meta: {
          ...(kernelResult0.state?.meta ?? {}),
          "ui.suggestions": { value: uiSuggestions, source_node: "SYSTEM_UI" },
          "threads.return_depth": { value: returnDepth, source_node: "SYSTEM_UI" },
        },
      },
    }

    let kernelResultFinal: KernelResult = kernelResult

    const scanThreads = await maybeTriggerScanThreadsJob({
      userKey,
      input: input as InputSignal,
      conversationId: kernelResultFinal.state.conversation_id,
      kernelResult: kernelResultFinal,
    })
    kernelResultFinal = scanThreads.kernelResult

    await persistState(kernelResultFinal)

    // Canonical events (V1)
    const assistantText = kernelResultFinal.transition.response_message ?? kernelResultFinal.state.active_node_message

    const rawUserText =
      (input as any).type === "FREE_TEXT" ? String((input as any).text ?? "") : toUserInput(input) ?? ""

    await emitCanonicalEvent({
      userKey,
      conversationId: kernelResultFinal.state.conversation_id,
      revision: kernelResultFinal.state.revision,
      inputId: kernelResultFinal.state.revision,
      nodeId: kernelResultFinal.log.active_node_before ?? (baseState?.active_node ?? null),
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
      conversationId: kernelResultFinal.state.conversation_id,
      revision: kernelResultFinal.state.revision,
      inputId: kernelResultFinal.state.revision,
      nodeId: kernelResultFinal.state.active_node,
      eventType: "transition_applied",
      payload: {
        input_type: (input as any).type,
        transition: {
          type: kernelResultFinal.transition.type,
          from: kernelResultFinal.transition.from,
          // Ensure canonical events always carry a concrete destination node.
          // Some internal transitions (e.g. "NODE_HOP" with external resolution) may leave `to` unset.
          // Falling back to the post-transition active node keeps the event self-contained.
          to: kernelResultFinal.transition.to ?? kernelResultFinal.state.active_node,
          reason: kernelResultFinal.transition.reason,
          meta_keys_written: kernelResultFinal.transition.meta_delta ? Object.keys(kernelResultFinal.transition.meta_delta) : [],
        },
        status_after: kernelResultFinal.state.status,
      },
    })

    const activeNode = getNode(kernelResultFinal.state.active_node)

    await emitCanonicalEvent({
      userKey,
      conversationId: kernelResultFinal.state.conversation_id,
      revision: kernelResultFinal.state.revision,
      inputId: kernelResultFinal.state.revision,
      nodeId: kernelResultFinal.state.active_node,
      eventType: "node_rendered",
      payload: {
        node_id: kernelResultFinal.state.active_node,
        node_kind: (activeNode as any)?.kind ?? null,
        capability_id: (activeNode as any)?.kind === "DIALOG" ? (activeNode as any)?.capability_id ?? null : null,
        tool_id: (activeNode as any)?.kind === "TOOL" ? (activeNode as any)?.tool?.tool_id ?? null : null,
        message: truncateText(assistantText ?? "", 800),
        ai_output_length: (assistantText ?? "").length,
        status: kernelResultFinal.state.status,
      },
    })

    if (scanThreads.jobTriggered) {
      await emitCanonicalEvent({
        userKey,
        conversationId: kernelResultFinal.state.conversation_id,
        revision: kernelResultFinal.state.revision,
        inputId: kernelResultFinal.state.revision,
        nodeId: kernelResultFinal.state.active_node,
        eventType: "job_queued",
        payload: {
          kind: "scan_threads",
          source: "chat_api",
          based_on_revision: scanThreads.deferredJob?.based_on_revision ?? kernelResultFinal.state.revision,
          mode: scanThreads.deferredJob?.mode ?? "shadow",
        },
      })
    }

    // Terminal events: emit only on status change (no inference).
    const prevStatus = typeof baseState?.status === "string" ? baseState.status : null
    if (prevStatus !== kernelResultFinal.state.status) {
      if (kernelResultFinal.state.status === "completed") {
        await emitCanonicalEvent({
          userKey,
          conversationId: kernelResultFinal.state.conversation_id,
          revision: kernelResultFinal.state.revision,
          inputId: kernelResultFinal.state.revision,
          nodeId: kernelResultFinal.state.active_node,
          eventType: "conversation_completed",
          payload: {
            terminal_revision: kernelResultFinal.state.revision,
            terminal_node: kernelResultFinal.state.active_node,
          },
        })
      }
      if (kernelResultFinal.state.status === "rejected") {
        await emitCanonicalEvent({
          userKey,
          conversationId: kernelResultFinal.state.conversation_id,
          revision: kernelResultFinal.state.revision,
          inputId: kernelResultFinal.state.revision,
          nodeId: kernelResultFinal.state.active_node,
          eventType: "conversation_rejected",
          payload: {
            terminal_revision: kernelResultFinal.state.revision,
            terminal_node: kernelResultFinal.state.active_node,
          },
        })
      }
    }

    await maybeAutoLabelThread({
      userKey,
      conversationId: kernelResultFinal.state.conversation_id,
      input,
      revisionAfter: kernelResultFinal.state.revision,
    })

    const metaKeysWritten = kernelResultFinal.transition.meta_delta ? Object.keys(kernelResultFinal.transition.meta_delta) : []

    await emitSpine({
      userKey,
      input,
      kernelResult: kernelResultFinal,
      latencyMs: Date.now() - started,
    })

    await enqueueSummarizeEpisode({
      userKey,
      conversationId: kernelResultFinal.state.conversation_id,
      revisionAfter: kernelResultFinal.state.revision,
      threadThemeId: threadBinding?.themeId ?? (kernelResultFinal.state.meta?.["thread.theme_id"] as any)?.value,
      threadEpisodeId: threadBinding?.episodeId ?? (kernelResultFinal.state.meta?.["thread.episode_id"] as any)?.value,
    })

    await enqueueSuggestFacts({
      userKey,
      conversationId: kernelResultFinal.state.conversation_id,
      revisionAfter: kernelResultFinal.state.revision,
      metaKeysWritten,
      threadThemeId: threadBinding?.themeId ?? (kernelResultFinal.state.meta?.["thread.theme_id"] as any)?.value,
      threadEpisodeId: threadBinding?.episodeId ?? (kernelResultFinal.state.meta?.["thread.episode_id"] as any)?.value,
    })

    // Reflection CBA updates:
    // - Hobby cannot run frequent cron reliably, so we support a synchronous prototype mode.
    // - If GAARSDAL_REFLECTION_CBA_SYNC=1, we run CBA in-band (adds latency but updates schema immediately).
    // - Otherwise we enqueue an async job (requires an external worker trigger).
    const userMessage = (input as any).type === "FREE_TEXT" ? String((input as any).text ?? "") : ""
    const therapistMessage = String(kernelResultFinal.transition.response_message ?? kernelResultFinal.state.active_node_message ?? "")
    const activeNodeAfter = kernelResultFinal.state.active_node

    const syncCbaEnabled = process.env.GAARSDAL_REFLECTION_CBA_SYNC === "1"
    if (syncCbaEnabled && activeNodeAfter === "REFLECTION") {
      // Best-effort: failures must not break chat.
      try {
        await runReflectionCbaUpdate({
          conversationId: kernelResultFinal.state.conversation_id,
          userMessage,
          therapistMessage,
        })
      } catch {
        // ignore
      }
    } else {
      await enqueueReflectionCbaUpdate({
        userKey,
        conversationId: kernelResultFinal.state.conversation_id,
        revisionAfter: kernelResultFinal.state.revision,
        activeNodeAfter,
        userMessage,
        therapistMessage,
        threadThemeId: threadBinding?.themeId ?? (kernelResultFinal.state.meta?.["thread.theme_id"] as any)?.value,
        threadEpisodeId: threadBinding?.episodeId ?? (kernelResultFinal.state.meta?.["thread.episode_id"] as any)?.value,
      })
    }

    await logAndRecord({
      userKey,
      input,
      kernelResult: kernelResultFinal,
      userText: (input as any).type === "FREE_TEXT" ? (input as any).text : undefined,
    })

    const indexNow = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

    res.status(200).json({
      ...kernelResultFinal,
      state: withThreadMeta({ state: kernelResultFinal.state, index: indexNow }),
      deferred_job: scanThreads.deferredJob ?? null,
    })
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
