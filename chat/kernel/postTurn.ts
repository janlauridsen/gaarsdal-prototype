// chat/kernel/postTurn.ts
import type { InputSignal, KernelResult } from "./types"
import { appendConversationEventV1 } from "../events/store"
import { appendRawTurn } from "../raw/store"
import { readUserProfile, recordTurn, writeUserProfile } from "../memory/store"
import { consolidateV1 } from "../platform/consolidation"
import {
  ensureThreadIndex,
  isGenericThreadTitle,
  setActiveThread,
  updateThreadPreview,
  writeThreadIndex,
} from "../persistence/threadIndexStore"
import { enqueueJob, makeJobId } from "../async/queue"
import { jobsTtlSeconds, triggerJob } from "../jobs/store"
import type { DeferredJobSignal, ProblemSpecV1 } from "../jobs/types"
import { newUuid } from "../utils/ids"
import { envBool, envInt } from "../utils/env"
import { MEMORY_TTL_SECONDS, PROFILE_TTL_SECONDS } from "../utils/ttl"
import { isLobbyConversation, isControlInput, toUserInput, truncateText } from "../utils/conversation"

const DEFAULT_RAW_TTL_DAYS = 14

function rawTtlSeconds(): number {
  return envInt("GAARSDAL_RAW_TTL_DAYS", DEFAULT_RAW_TTL_DAYS) * 24 * 60 * 60
}

function nowMs(): number {
  return Date.now()
}

async function emitCanonicalEvent(params: {
  userKey: string
  conversationId: string
  revision: number
  nodeId?: string | null
  eventType: string
  payload: unknown
}): Promise<void> {
  await appendConversationEventV1({
    schema_version: "v1",
    event_id: newUuid(),
    event_type: params.eventType as any,
    conversation_id: params.conversationId,
    user_key: params.userKey,
    revision: params.revision,
    input_id: params.revision,
    node_id: params.nodeId ?? undefined,
    timestamp_ms: nowMs(),
    payload: params.payload,
  })
}

async function writeRawAndMemory(params: {
  userKey: string
  input: InputSignal
  kernelResult: KernelResult
  userText?: string
}): Promise<void> {
  const { kernelResult, input } = params
  const assistantText = kernelResult.transition.response_message ?? kernelResult.state.active_node_message

  await appendRawTurn({
    conversationId: kernelResult.state.conversation_id,
    revision: kernelResult.state.revision,
    nodeId: kernelResult.state.active_node,
    inputType: (input as any).type,
    userInput: params.userText ?? toUserInput(input),
    assistantOutput: assistantText,
    ttlSeconds: rawTtlSeconds(),
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

  const profile = await readUserProfile(params.userKey)
  if (profile) {
    const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: kernelResult.state })
    if (didUpdate) {
      await writeUserProfile({ userKey: params.userKey, profile: updated, ttlSeconds: PROFILE_TTL_SECONDS })
    }
  }
}

async function maybeUpdateThreadPreview(params: {
  userKey: string
  conversationId: string
  input: InputSignal
}): Promise<void> {
  if (isLobbyConversation(params.conversationId)) return
  if (params.input.type !== "FREE_TEXT") return
  const userText = ((params.input as any).text ?? "").trim()
  if (!userText || isControlInput(userText)) return

  const index0 = await ensureThreadIndex({ userKey: params.userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  let index1 = updateThreadPreview({
    index: index0,
    conversationId: params.conversationId,
    previewText: userText,
    maxPreviewChars: 120,
  })
  index1 = setActiveThread({ index: index1, conversationId: params.conversationId })
  if (JSON.stringify(index0) === JSON.stringify(index1)) return
  await writeThreadIndex({ userKey: params.userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })
}

async function maybeTriggerDeriveThreadTitleJob(params: {
  userKey: string
  input: InputSignal
  conversationId: string
  revisionAfter: number
}): Promise<void> {
  const { userKey, input, conversationId, revisionAfter } = params
  if (isLobbyConversation(conversationId)) return
  if (input.type !== "FREE_TEXT") return
  const userText = ((input as any).text ?? "").trim()
  if (!userText || isControlInput(userText)) return
  if (revisionAfter < 1 || revisionAfter > 3) return

  const index = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  const thread = index.threads.find((t) => t.conversation_id === conversationId)
  if (!thread) return

  const currentConfidence = typeof (thread as any).title_confidence === "number" ? Number((thread as any).title_confidence) : 0
  const currentBasisRevision = typeof (thread as any).title_basis_revision === "number" ? Number((thread as any).title_basis_revision) : 0
  const frozen = currentConfidence >= 0.8 || currentBasisRevision >= 4
  if (!isGenericThreadTitle(thread.title) && frozen) return

  await triggerJob({
    userKey,
    conversationId,
    kind: "derive_thread_title",
    payload: { trigger_turn: revisionAfter },
    ttlSeconds: jobsTtlSeconds(),
    dedupe: true,
    basedOnRevision: Math.max(0, revisionAfter),
    mode: "shadow",
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
  if (params.revisionAfter <= 0 || params.revisionAfter % N !== 0) return
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

export function runPostTurn(params: {
  userKey: string
  input: InputSignal
  kernelResult: KernelResult
  binding: { themeId?: string; episodeId?: string } | null
  includeText: boolean
  userText: string
  assistantText: string
  metaKeysWritten: string[]
  terminalStatus: string
}): void {
  const { userKey, input, kernelResult, binding, includeText, userText, assistantText, metaKeysWritten, terminalStatus } = params
  const conversationId = kernelResult.state.conversation_id
  const revision = kernelResult.state.revision
  const nodeId = kernelResult.state.active_node

  const themeId = binding?.themeId ?? (kernelResult.state.meta?.["thread.theme_id"] as any)?.value
  const episodeId = binding?.episodeId ?? (kernelResult.state.meta?.["thread.episode_id"] as any)?.value

  const terminalEvents =
    terminalStatus === "completed" || terminalStatus === "rejected"
      ? [
          emitCanonicalEvent({ userKey, conversationId, revision, nodeId, eventType: "conversation_terminal", payload: { terminal_status: terminalStatus, terminal_revision: revision, terminal_node: nodeId } }),
          emitCanonicalEvent({ userKey, conversationId, revision, nodeId, eventType: terminalStatus === "completed" ? "conversation_completed" : "conversation_rejected", payload: { terminal_revision: revision, terminal_node: nodeId } }),
        ]
      : []

  Promise.allSettled([
    emitCanonicalEvent({
      userKey, conversationId, revision, nodeId,
      eventType: "transition_applied",
      payload: {
        input_type: (input as any).type,
        transition: {
          type: kernelResult.transition.type,
          from: kernelResult.transition.from ?? null,
          to: kernelResult.transition.to ?? nodeId,
          reason: kernelResult.transition.reason,
          meta_keys_written: metaKeysWritten,
        },
        status_after: terminalStatus,
      },
    }),
    emitCanonicalEvent({
      userKey, conversationId, revision, nodeId,
      eventType: "message_exchanged",
      payload: {
        input_type: (input as any).type,
        user_message: includeText ? truncateText(userText, 4000) : undefined,
        assistant_message: includeText ? truncateText(assistantText, 4000) : undefined,
        active_node: nodeId,
      },
    }),
    emitCanonicalEvent({
      userKey, conversationId, revision, nodeId,
      eventType: "node_rendered",
      payload: {
        node_id: nodeId,
        message: truncateText(kernelResult.state.active_node_message ?? "", 800),
        status: terminalStatus,
      },
    }),
    ...terminalEvents,
    maybeUpdateThreadPreview({ userKey, conversationId, input }),
    enqueueSummarizeEpisode({ userKey, conversationId, revisionAfter: revision, threadThemeId: themeId, threadEpisodeId: episodeId }),
    enqueueSuggestFacts({ userKey, conversationId, revisionAfter: revision, metaKeysWritten, threadThemeId: themeId, threadEpisodeId: episodeId }),
    writeRawAndMemory({ userKey, input, kernelResult, userText: (input as any).type === "FREE_TEXT" ? (input as any).text : undefined }),
    maybeTriggerDeriveThreadTitleJob({ userKey, input, conversationId, revisionAfter: revision }),
  ]).catch(() => {
    // Fejl i post-writes påvirker ikke brugeren
  })
}

export async function maybeTriggerScanThreadsJob(params: {
  userKey: string
  input: InputSignal
  conversationId: string
  state: any
  revisionAfter: number
}): Promise<{ deferredJob: DeferredJobSignal | null }> {
  const { userKey, input, conversationId, state, revisionAfter } = params
  if (input.type !== "FREE_TEXT") return { deferredJob: null }

  const userText = ((input as any).text ?? "").trim()
  if (!userText) return { deferredJob: null }

  const explicitReuse = looksLikeHistoryReuseRequest(userText)
  const problem = buildProblemSpecFromGenHypno(state)
  const auto = shouldAutoTriggerHistoryScan({ state, problem, userText })

  if (!explicitReuse && !auto.shouldTrigger) return { deferredJob: null }
  if (!problem) return { deferredJob: null }

  const { jobId } = await triggerJob({
    userKey,
    conversationId,
    kind: "scan_threads",
    payload: {
      problem,
      scan_reason: explicitReuse ? "explicit" : "auto",
      trigger_turn: auto.turnCount > 0 ? auto.turnCount : undefined,
    },
    ttlSeconds: jobsTtlSeconds(),
    dedupe: true,
    basedOnRevision: Math.max(0, revisionAfter),
    mode: "shadow",
  })

  if (!jobId) return { deferredJob: null }

  return {
    deferredJob: {
      pending: true,
      job_id: jobId,
      kind: "scan_threads",
      mode: "shadow",
      based_on_revision: Math.max(0, revisionAfter),
    },
  }
}

// ---- history-scan helpers (moved from chat.ts) ----

function looksLikeHistoryReuseRequest(text: string): boolean {
  const s = text.trim().toLowerCase()
  if (!s) return false
  const explicitCrossThreadScan =
    /(scan|scann|gennemgå|gennemgaa|tjek|find|søg|soeg|kig i|se i).*(på tværs af|paa tvaers af|tidligere|forrige|gamle|historik|forløb|forloeb|andre).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s) ||
    /(på tværs af|paa tvaers af).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s)
  const explicitHistoryReuse =
    /(tjek|gennemgå|gennemgaa|scan|scann|søg|soeg|find|brug|genbrug|se i|kig i)/.test(s) &&
    (/(tidligere|forrige|gamle|historik|forløb|forloeb).*(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger)/.test(s) ||
      /(tråd|traad|tråde|traade|samtale|samtaler|dialog|dialoger).*(tidligere|forrige|gamle|historik|forløb|forloeb)/.test(s) ||
      /(andre).*(samtaler|dialoger|tråde|traade)/.test(s))
  const retrospectiveQuestion =
    /(har|hvad|ved du om).*(jeg|vi).*(talt om|nævnt|naevnt|været inde på|vaeret inde paa|fortalt).*(før|foer|tidligere)/.test(s) ||
    /(har|hvad|ved du om).*(jeg|vi).*(talt om|nævnt|naevnt|været inde på|vaeret inde paa|fortalt).*(i andre samtaler|i andre tråde|i andre traade)/.test(s)
  return explicitCrossThreadScan || explicitHistoryReuse || retrospectiveQuestion
}

function readMetaValue(state: any, key: string): unknown {
  const entry = state?.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
  return entry
}

function toStringArray(value: unknown, max = 3): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, max)
}

function buildProblemSpecFromGenHypno(state: any): ProblemSpecV1 | null {
  const problemTitle = typeof readMetaValue(state, "gen_hypno.problem_title") === "string" ? (readMetaValue(state, "gen_hypno.problem_title") as string).trim() : ""
  const problemSummary = typeof readMetaValue(state, "gen_hypno.problem_summary") === "string" ? (readMetaValue(state, "gen_hypno.problem_summary") as string).trim() : ""
  const lastTopic = typeof readMetaValue(state, "gen_hypno.last_topic") === "string" ? (readMetaValue(state, "gen_hypno.last_topic") as string).trim() : ""
  const topicTags = toStringArray(readMetaValue(state, "gen_hypno.topic_tags"), 3)

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
  if (typeof assistantTurnCountRaw === "number" && Number.isFinite(assistantTurnCountRaw)) {
    return Math.max(0, Math.trunc(assistantTurnCountRaw))
  }
  const transcriptRaw = readMetaValue(state, "gen_hypno.transcript")
  if (Array.isArray(transcriptRaw)) {
    return Math.max(0, transcriptRaw.filter((item) => item && typeof item === "object" && (item as any).role === "assistant").length)
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
