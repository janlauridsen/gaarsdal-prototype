// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next"

// Sæt maxDuration højt nok til at drain kan køre EFTER response er sendt.
// Vercel Hobby understøtter op til 60 sek.
export const config = { maxDuration: 30 }
// waitUntil: keeps the serverless function alive until the promise settles.
// Falls back to a no-op outside Vercel (local dev) so behaviour is identical.
const waitUntil: (p: Promise<unknown>) => void =
  (globalThis as any)[Symbol.for("vercel.waitUntil")] ??
  ((p: Promise<unknown>) => { p.catch(() => {}) })

import { runNode } from "../../chat/runtime/nodeRunner"
import { createInitialState, createLobbyState, buildReturnGreeting } from "../../chat/kernel/state"
import type { InputSignal, KernelResult } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"

import { readConversationState, writeConversationState } from "../../chat/persistence/conversationStateStore"
import { ensureThreadIndex } from "../../chat/persistence/threadIndexStore"
import { appendConversationEventV1 } from "../../chat/events/store"
import { getOrCreateThreadThemeAndEpisode } from "../../chat/memory/longTermMemoryStore"

import { handleThreadCreate, handleThreadSwitch, handleThreadArchive } from "../../chat/threads/threadHandler"
import { runPostTurn, maybeTriggerScanThreadsJob } from "../../chat/kernel/postTurn"
import { processQueueBatch } from "../../chat/async/worker"

import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { newUuid } from "../../chat/utils/ids"
import { envBool } from "../../chat/utils/env"
import { SESSION_TTL_SECONDS, PROFILE_TTL_SECONDS, MEMORY_TTL_SECONDS } from "../../chat/utils/ttl"
import { isLobbyConversation, toLobbyConversationId, toUserInput, truncateText, withThreadMeta } from "../../chat/utils/conversation"
import { nowMs } from "../../chat/utils/time"

function serializeActiveNode(nodeId: string): { node_kind: string; node_allow_free_text: boolean; node_allowed_exits: string[]; node_form?: { fields: Array<{ id: string; label: string; required?: boolean; placeholder?: string }> } } {
  try {
    const node = getNode(nodeId)
    const out: any = {
      node_kind: node.kind,
      node_allow_free_text: node.allow_free_text,
      node_allowed_exits: node.allowed_exits ?? [],
    }
    if (node.kind === "FORM" && node.form) {
      out.node_form = {
        fields: node.form.fields.map((f) => ({
          id: f.id,
          label: f.label,
          required: f.required ?? false,
          placeholder: f.placeholder ?? "",
        })),
      }
    }
    return out
  } catch {
    return { node_kind: "DIALOG", node_allow_free_text: true, node_allowed_exits: [] }
  }
}

type ChatRequestBody = { state: any; input: ApiInputSignal }

type ApiInputSignal =
  | InputSignal
  | { type: "THREAD_CREATE"; mode: "normal" | "parenthesis" }
  | { type: "THREAD_SWITCH"; conversation_id: string }
  | { type: "THREAD_ARCHIVE"; conversation_id?: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}
function isPlatformThreadInput(input: ApiInputSignal): boolean {
  const t = (input as any)?.type
  return t === "THREAD_CREATE" || t === "THREAD_SWITCH" || t === "THREAD_ARCHIVE"
}
function isAutoAdvanceNode(node: { id: string; kind: unknown }): boolean {
  if (node.kind === "ROUTER" && node.id === "HOME") return false
  return node.kind === "ROUTER" || node.kind === "TOOL" || node.kind === "CHECKPOINT"
}

function validateRequest(req: NextApiRequest, res: NextApiResponse): ChatRequestBody | null {
  setWidgetCors(req, res, "POST, OPTIONS")
  if (req.method === "OPTIONS") { res.status(200).end(); return null }
  if (req.method !== "POST") { res.status(405).json({ error: "Method Not Allowed" }); return null }
  if (!isObject(req.body)) { res.status(400).json({ error: "Invalid JSON body" }); return null }
  const body = req.body as ChatRequestBody
  const input = (body as any).input
  if (!input || !isObject(input) || typeof (input as any).type !== "string") {
    res.status(400).json({ error: "Missing or invalid input" }); return null
  }
  return body
}

async function emitCanonicalEvent(params: {
  userKey: string; conversationId: string; revision: number
  nodeId?: string | null; eventType: string; payload: unknown
}): Promise<void> {
  await appendConversationEventV1({
    schema_version: "v1", event_id: newUuid(), event_type: params.eventType as any,
    conversation_id: params.conversationId, user_key: params.userKey,
    revision: params.revision, input_id: params.revision,
    node_id: params.nodeId ?? undefined, timestamp_ms: nowMs(), payload: params.payload,
  })
}

async function ensureThreadBindingOnState(params: { userKey: string; conversationId: string; state: any }):
  Promise<{ state: any; themeId: string; episodeId: string } | null> {
  const meta = params.state?.meta && typeof params.state.meta === "object" ? params.state.meta : {}
  const existingThemeId = (meta?.["thread.theme_id"] as any)?.value
  const existingEpisodeId = (meta?.["thread.episode_id"] as any)?.value
  if (typeof existingThemeId === "string" && typeof existingEpisodeId === "string") {
    return { state: params.state, themeId: existingThemeId, episodeId: existingEpisodeId }
  }
  const ensured = await getOrCreateThreadThemeAndEpisode({ userKey: params.userKey, conversationId: params.conversationId, ttlSeconds: MEMORY_TTL_SECONDS })
  const nextMeta = { ...meta, "thread.theme_id": { value: ensured.theme.theme_id, source_node: "SYSTEM_THREAD_BINDING" }, "thread.episode_id": { value: ensured.episode.episode_id, source_node: "SYSTEM_THREAD_BINDING" } }
  return { state: { ...params.state, meta: nextMeta }, themeId: ensured.theme.theme_id, episodeId: ensured.episode.episode_id }
}

async function handleInitOrRestore(params: {
  clientState: any; storedState: any | null; conversationId: string
  conversationKind: "lobby" | "thread"; userKey: string; res: NextApiResponse
}): Promise<boolean> {
  const { clientState, storedState, conversationId, conversationKind, userKey, res } = params
  if (clientState !== null) return false

  const baseState = storedState ?? (conversationKind === "lobby" ? createLobbyState(conversationId) : createInitialState(conversationId))
  const isNew = !storedState
  if (isNew) await writeConversationState(baseState, SESSION_TTL_SECONDS)

  await Promise.all([
    emitCanonicalEvent({ userKey, conversationId: baseState.conversation_id, revision: baseState.revision, nodeId: baseState.active_node, eventType: "transition_applied", payload: { input_type: "SYSTEM_INIT", transition: { type: "INIT", from: null, to: baseState.active_node, reason: isNew ? "system init" : "system init (restored)", meta_keys_written: [] }, status_after: baseState.status } }),
    emitCanonicalEvent({ userKey, conversationId: baseState.conversation_id, revision: baseState.revision, nodeId: baseState.active_node, eventType: "node_rendered", payload: { node_id: baseState.active_node, message: truncateText(baseState.active_node_message ?? "", 800), status: baseState.status } }),
  ])

  const indexNow = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

  // Bestem velkomstbesked baseret på om det er første gang eller en returbruger
  const isFirstEverVisit = isNew && indexNow.threads.length === 0
  let welcomeMessage = baseState.active_node_message

  if (conversationKind === "thread") {
    if (isFirstEverVisit) {
      welcomeMessage =
        "Hej. Jeg er en AI-assistent hos Gaarsdal Hypnoterapi — ikke Jan selv.\n\n" +
        "Her kan du stille spørgsmål om hypnoterapi, reflektere over vaner eller mønstre, " +
        "eller finde ud af om en samtale med Jan kunne give mening for dig.\n\n" +
        "Hvad har du på hjerte?"
    } else if (!isNew) {
      const returnGreeting = buildReturnGreeting({ storedState: baseState, conversationKind })
      if (returnGreeting) welcomeMessage = returnGreeting
    }
  }

  const stateForResponse = welcomeMessage !== baseState.active_node_message
    ? { ...baseState, active_node_message: welcomeMessage }
    : baseState

  res.status(200).json({ state: withThreadMeta(stateForResponse, indexNow), ...serializeActiveNode(baseState.active_node), transition: { type: "INIT", from: null, to: baseState.active_node, reason: isNew ? "system init" : "system init (restored)" }, log: { conversation_id: baseState.conversation_id, revision_before: isNew ? -1 : baseState.revision, revision_after: baseState.revision, active_node_before: isNew ? null : baseState.active_node, active_node_after: baseState.active_node, input_type: "SYSTEM_INIT", transition_type: "INIT", timestamp: new Date().toISOString() } })
  return true
}

async function runTurnWithAutoAdvance(params: { baseState: any; input: InputSignal; userKey: string }): Promise<KernelResult> {
  let kernelResult = await runNode({ state: params.baseState, input: params.input, userKey: params.userKey })
  for (let i = 0; i < 5; i++) {
    const activeNode = getNode(kernelResult.state.active_node)
    if (!isAutoAdvanceNode(activeNode)) break
    const before = kernelResult.state.active_node
    kernelResult = await runNode({ state: kernelResult.state, input: { type: "SYSTEM", intent: "AUTO_TICK" } as any, userKey: params.userKey })
    if (kernelResult.state.active_node === before) break
  }
  return kernelResult
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = validateRequest(req, res)
  if (!body) return

  const userKey = ensureUserKey(req, res)
  const clientState = body.state ?? null
  const input = body.input
  const requestedConversationId =
    (isPlatformThreadInput(input) && (input as any).type === "THREAD_SWITCH" && (input as any).conversation_id) ||
    (clientState && typeof clientState.conversation_id === "string" ? clientState.conversation_id : undefined)

  const conversationId = requestedConversationId || toLobbyConversationId(userKey)
  const conversationKind: "lobby" | "thread" = isLobbyConversation(conversationId) ? "lobby" : "thread"
  const stored = await readConversationState(conversationId)

  try {
    if (isPlatformThreadInput(input)) {
      if ((input as any).type === "THREAD_CREATE") { await handleThreadCreate({ input: input as any, userKey, res }); return }
      if ((input as any).type === "THREAD_SWITCH") { await handleThreadSwitch({ input: input as any, userKey, res }); return }
      if ((input as any).type === "THREAD_ARCHIVE") { await handleThreadArchive({ userKey, res, conversationId: (input as any).conversation_id }); return }
    }

    const restored = await handleInitOrRestore({ clientState, storedState: stored, conversationId, conversationKind, userKey, res })
    if (restored) return

    const baseState = stored ?? clientState
    if (!baseState) return res.status(400).json({ error: "Missing state" })

    let kernelResultFinal = await runTurnWithAutoAdvance({ baseState, input: input as InputSignal, userKey })

    const binding = await ensureThreadBindingOnState({ userKey, conversationId: kernelResultFinal.state.conversation_id, state: kernelResultFinal.state })
    if (binding) kernelResultFinal = { ...kernelResultFinal, state: binding.state }

    await writeConversationState(kernelResultFinal.state, SESSION_TTL_SECONDS)

    const [scanThreads, indexNow] = await Promise.all([
      maybeTriggerScanThreadsJob({ userKey, input: input as InputSignal, conversationId: kernelResultFinal.state.conversation_id, state: kernelResultFinal.state, revisionAfter: kernelResultFinal.state.revision }),
      ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS }),
    ])

    const userText = (input as any).type === "FREE_TEXT" ? String((input as any).text ?? "") : toUserInput(input as InputSignal) ?? ""
    const assistantText = String(kernelResultFinal.transition.response_message ?? kernelResultFinal.state.active_node_message ?? "")
    const metaKeysWritten = kernelResultFinal.transition.meta_delta ? Object.keys(kernelResultFinal.transition.meta_delta) : []

    // Run postTurn to enqueue SUMMARIZE_EPISODE / SUGGEST_FACTS jobs + write raw/memory/events.
    // Must settle before we drain the queue below.
    await Promise.allSettled([Promise.resolve(runPostTurn({
      userKey, input: input as InputSignal, kernelResult: kernelResultFinal, binding,
      includeText: envBool("GAARSDAL_EVENTS_INCLUDE_TEXT"),
      userText, assistantText, metaKeysWritten,
      terminalStatus: kernelResultFinal.state.status,
    }))])

    // Send response immediately — bruger ser svar med det samme.
    // Drain kører bagefter via waitUntil, som holder funktionen i live
    // indtil jobsene er færdige (eller maxDuration rammes).
    res.status(200).json({
      ...kernelResultFinal,
      state: withThreadMeta(kernelResultFinal.state, indexNow),
      ...serializeActiveNode(kernelResultFinal.state.active_node),
      deferred_job: scanThreads.deferredJob ?? null,
    })

    // Post-response drain: kør op til 2 async jobs i baggrunden.
    waitUntil(
      Promise.race([
        processQueueBatch(2),
        new Promise<void>((resolve) => setTimeout(resolve, 8000)),
      ]).catch(() => {})
    )

  } catch (e: any) {
    await emitCanonicalEvent({
      userKey, conversationId, revision: stored?.revision ?? -1, nodeId: stored?.active_node ?? null,
      eventType: "error_raised",
      payload: { code: "UNHANDLED", message: typeof e?.message === "string" ? e.message : "Unknown error", stage: "runtime", input_type: (input as any).type },
    })
    return res.status(500).json({ error: "Internal Server Error", detail: process.env.NODE_ENV === "development" ? String(e?.message || e) : undefined })
  }
}
