import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobs } from "./queue"
import { readInteractions } from "../logging/sink"
import {
  ensureDefaultThemeAndEpisode,
  readEpisode,
  readFacts,
  upsertEpisode,
  upsertFact,
  type MemoryFact,
} from "../memory/longTermMemoryStore"
import { readConversationState } from "../persistence/conversationStateStore"

const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // keep aligned with other memory TTLs for now

function clampText(s: string, max: number): string {
  const t = (s ?? "").trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + "…"
}

function makeDeterministicSummary(params: { interactions: Array<{ user_input?: string; ai_response?: string }> }): string {
  const lastUser = [...params.interactions].reverse().find((x) => (x.user_input ?? "").trim().length > 0)?.user_input ?? ""
  const lastAi = [...params.interactions].reverse().find((x) => (x.ai_response ?? "").trim().length > 0)?.ai_response ?? ""

  const parts: string[] = []
  if (lastUser.trim()) parts.push(`Seneste tema fra bruger: ${clampText(lastUser, 180)}`)
  if (lastAi.trim()) parts.push(`Seneste respons: ${clampText(lastAi, 220)}`)

  if (!parts.length) return "Ingen tilgængelige interaktioner at opsummere endnu."
  return parts.join("\n")
}

function nowMs(): number {
  return Date.now()
}

function stableFactId(params: { userKey: string; key: string }): string {
  // deterministic id: prevents creating endless duplicates for the same key
  const raw = `${params.userKey}|${params.key}`
  // small stable hash
  let h = 0
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) >>> 0
  return `fact:${h.toString(16)}`
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0
}

function readMetaValue(state: any, key: string): unknown {
  const entry = state?.meta?.[key]
  if (!entry || typeof entry !== "object") return undefined
  return (entry as any).value
}

async function upsertSuggestedFact(params: {
  userKey: string
  key: string
  value: any
  createdBy: string
}): Promise<void> {
  // If a canonical fact already exists for this key, do not overwrite it.
  const existing = await readFacts({ userKey: params.userKey, limit: 500 })
  const canonicalExists = existing.some((f) => f.key === params.key && f.status === "canonical")
  if (canonicalExists) return

  const fact_id = stableFactId({ userKey: params.userKey, key: params.key })
  const ts = nowMs()

  // If there is an existing suggested fact for the key, keep history light and overwrite value.
  const prior = existing.find((f) => f.fact_id === fact_id)

  const fact: MemoryFact = {
    fact_id,
    key: params.key,
    value: params.value,
    status: "suggested",
    created_at: prior?.created_at ?? ts,
    updated_at: ts,
    provenance: {
      created_by: prior?.provenance?.created_by ?? params.createdBy,
      last_edited_by: params.createdBy,
    },
    edit_history: prior?.edit_history ?? [],
  }

  await upsertFact({ userKey: params.userKey, fact, ttlSeconds: MEMORY_TTL_SECONDS })
}

async function processSummarizeEpisode(job: AsyncJobV23): Promise<AsyncJobResult> {
  const ensured = await ensureDefaultThemeAndEpisode({ userKey: job.user_key, ttlSeconds: MEMORY_TTL_SECONDS })

  const episodeId = job.episode_id || ensured.episode.episode_id
  const episode = (await readEpisode({ userKey: job.user_key, episodeId })) ?? ensured.episode

  const interactions = await readInteractions(job.conversation_id)
  const last = interactions.slice(-12)

  const summary = makeDeterministicSummary({ interactions: last })
  const openLoops: string[] = [] // v23: empty; later: extract questions/tasks

  await upsertEpisode({
    userKey: job.user_key,
    ttlSeconds: MEMORY_TTL_SECONDS,
    episode: {
      ...episode,
      summary_short: summary,
      open_loops: openLoops,
      updated_at: Date.now(),
    },
  })

  return { job_id: job.job_id, ok: true }
}

async function processSuggestFacts(job: AsyncJobV23): Promise<AsyncJobResult> {
  // Deterministic v23: derive a few facts from existing state.meta.
  const state = await readConversationState(job.conversation_id)
  if (!state) return { job_id: job.job_id, ok: true }

  // triage-derived suggestions (only if present)
  const triageGoal = readMetaValue(state, "triage.user_goal")
  if (isNonEmptyString(triageGoal)) {
    await upsertSuggestedFact({
      userKey: job.user_key,
      key: "user.goal",
      value: triageGoal.trim(),
      createdBy: `job:${job.type}:${job.job_version}`,
    })
  }

  const tags = readMetaValue(state, "triage.topic_tags")
  if (Array.isArray(tags)) {
    const clean = tags.filter((t) => typeof t === "string").map((t) => t.trim()).filter(Boolean).slice(0, 8)
    if (clean.length) {
      await upsertSuggestedFact({
        userKey: job.user_key,
        key: "user.topic_tags",
        value: clean,
        createdBy: `job:${job.type}:${job.job_version}`,
      })
    }
  }

  const horizon = readMetaValue(state, "triage.time_horizon")
  if (isNonEmptyString(horizon)) {
    await upsertSuggestedFact({
      userKey: job.user_key,
      key: "user.time_horizon",
      value: horizon.trim(),
      createdBy: `job:${job.type}:${job.job_version}`,
    })
  }

  // optional: last topic from gen hypno
  const lastTopic = readMetaValue(state, "gen_hypno.last_topic")
  if (isNonEmptyString(lastTopic)) {
    await upsertSuggestedFact({
      userKey: job.user_key,
      key: "theme.general.last_topic",
      value: lastTopic.trim(),
      createdBy: `job:${job.type}:${job.job_version}`,
    })
  }

  return { job_id: job.job_id, ok: true }
}

export async function processJob(job: AsyncJobV23): Promise<AsyncJobResult> {
  try {
    if (job.type === "SUMMARIZE_EPISODE") return await processSummarizeEpisode(job)
    if (job.type === "SUGGEST_FACTS") return await processSuggestFacts(job)

    return { job_id: job.job_id, ok: false, error: { code: "UNKNOWN_JOB", message: `Unknown type: ${job.type}` } }
  } catch (e: any) {
    return {
      job_id: job.job_id,
      ok: false,
      error: {
        code: "JOB_FAILED",
        message: typeof e?.message === "string" ? e.message : "Unknown error",
      },
    }
  }
}

/**
 * Process a batch of jobs from the queue.
 */
export async function processQueueBatch(limit: number): Promise<{
  processed: number
  ok: number
  failed: number
  results: AsyncJobResult[]
}> {
  const jobs = await dequeueJobs(limit)
  const results: AsyncJobResult[] = []

  for (const job of jobs) {
    results.push(await processJob(job))
  }

  const ok = results.filter((r) => r.ok).length
  const failed = results.length - ok

  return {
    processed: results.length,
    ok,
    failed,
    results,
  }
}
