// chat/async/worker.ts
import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobsWithStats } from "./queue"
import { readRawTurns } from "../raw/store"
import { createOpenAiCompatibleClient } from "../ai/provider"
import {
  readEpisode,
  readFacts,
  readThemes,
  upsertTheme,
  upsertEpisode,
  upsertFact,
  type MemoryFact,
  readTheme,
  type Theme,
  type Episode,
} from "../memory/longTermMemoryStore"
import { readConversationState } from "../persistence/conversationStateStore"
import { MEMORY_TTL_SECONDS } from "../utils/ttl"
import { nowMs } from "../utils/time"

type ProcessBatchResult = {
  processed: number
  ok_count: number
  failed: number
  dropped: number
  results: AsyncJobResult[]
}


function getJsonModel(): string {
  // Use repo convention. If not set, keep a conservative default.
  return process.env.OPENAI_MODEL_JSON ?? "gpt-4o-mini"
}

export async function processQueueBatch(limit: number): Promise<ProcessBatchResult> {
  const { jobs, dropped } = await dequeueJobsWithStats(limit)
  const results: AsyncJobResult[] = []

  for (const job of jobs) {
    results.push(await processJob(job))
  }

  const ok_count = results.filter((r) => r.ok).length
  const failed = results.length - ok_count

  return {
    processed: results.length,
    ok_count,
    failed,
    dropped,
    results,
  }
}

async function processJob(job: AsyncJobV23): Promise<AsyncJobResult> {
  try {
    if (job.type === "SUMMARIZE_EPISODE") return await processSummarizeEpisode(job)
    if (job.type === "SUGGEST_FACTS") return await processSuggestFacts(job)

    return {
      job_id: job.job_id,
      ok: false,
      error: { code: "unknown_job_type", message: `Unknown job type: ${String((job as any).type)}` },
    }
  } catch (err: any) {
    return {
      job_id: job.job_id,
      ok: false,
      error: { code: "job_failed", message: err?.message ? String(err.message) : "Job failed" },
    }
  }
}

async function processSummarizeEpisode(job: AsyncJobV23): Promise<AsyncJobResult> {
  const state = await readConversationState(job.conversation_id)
  const turns = await readRawTurns({ conversationId: job.conversation_id })

  // Signatures in repo: readThemes/readFacts expect an options object.
  const themes = await readThemes({ userKey: job.user_key })
  const facts = await readFacts({ userKey: job.user_key })

  const llm = createOpenAiCompatibleClient()
  const model = getJsonModel()

  const prompt =
    "Summarize the user's episode for long-term memory.\n" +
    "Return JSON with fields: { theme_title, theme_summary, episode_title, episode_summary }.\n"

  const json = await llm.chatJson({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          conversation_id: job.conversation_id,
          episode_id: job.episode_id,
          turns,
          themes,
          facts,
          active_node: state.active_node,
        }),
      },
    ],
  })

  // If LLM unavailable, no-op (avoid retry loops in prototype).
  if (!json) return { job_id: job.job_id, ok: true }

  const themeTitle = String((json as any)?.theme_title ?? "").trim()
  const themeSummary = String((json as any)?.theme_summary ?? "").trim()
  const episodeTitle = String((json as any)?.episode_title ?? "").trim()
  const episodeSummary = String((json as any)?.episode_summary ?? "").trim()

  const ts = nowMs()

  // longTermMemoryStore Theme uses "label" (not title)
  if (themeTitle && themeSummary) {
    const existing = await readTheme({ userKey: job.user_key, themeId: job.theme_id })
    const theme: Theme = {
      theme_id: job.theme_id,
      label: themeTitle,
      status: existing?.status ?? "active",
      created_at: existing?.created_at ?? ts,
      updated_at: ts,
      origin: existing?.origin ?? "system_suggested",
    }

    await upsertTheme({ userKey: job.user_key, theme, ttlSeconds: MEMORY_TTL_SECONDS })
    // NOTE: themeSummary is not represented in Theme v23 store.
    // If you want to persist it, we need a schema change in longTermMemoryStore.ts (out of scope here).
    void themeSummary
  }

  // Episode uses summary_short (not title/summary fields)
  if (episodeTitle || episodeSummary) {
    const existing = await readEpisode({ userKey: job.user_key, episodeId: job.episode_id })
    const episode: Episode = {
      episode_id: job.episode_id,
      theme_id: job.theme_id,
      started_at: existing?.started_at ?? ts,
      ended_at: existing?.ended_at,
      summary_short: episodeSummary || existing?.summary_short,
      open_loops: existing?.open_loops,
      updated_at: ts,
    }

    await upsertEpisode({ userKey: job.user_key, episode, ttlSeconds: MEMORY_TTL_SECONDS })
    // NOTE: episodeTitle is not represented in Episode v23 store.
    void episodeTitle
  }

  return { job_id: job.job_id, ok: true }
}

async function processSuggestFacts(job: AsyncJobV23): Promise<AsyncJobResult> {
  // Signatures in repo: readTheme/readEpisode take params object.
  const theme = await readTheme({ userKey: job.user_key, themeId: job.theme_id })
  const episode = await readEpisode({ userKey: job.user_key, episodeId: job.episode_id })
  const turns = await readRawTurns({ conversationId: job.conversation_id })

  const llm = createOpenAiCompatibleClient()
  const model = getJsonModel()

  const prompt =
    "Extract candidate memory facts from the episode.\n" +
    "Return JSON: { facts: [{ key, value, confidence }] }.\n" +
    "Do not invent facts. Keep key short and stable.\n"

  const json = await llm.chatJson({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          theme,
          episode,
          turns,
        }),
      },
    ],
  })

  if (!json) return { job_id: job.job_id, ok: true }

  const factsArr = Array.isArray((json as any)?.facts) ? ((json as any).facts as any[]) : []
  const ts = nowMs()

  for (const f of factsArr) {
    const key = String(f?.key ?? "").trim()
    if (!key) continue

    const confidenceRaw = Number(f?.confidence ?? 0.0)
    const confidence = Number.isFinite(confidenceRaw) ? confidenceRaw : 0.0

    const memoryFact: MemoryFact = {
      fact_id: `${job.episode_id}:${Math.random().toString(16).slice(2)}`,
      key,
      value: (f as any)?.value,
      status: "suggested",
      confidence,
      created_at: ts,
      updated_at: ts,
      provenance: {
        created_by: "worker:suggest-facts-v1",
      },
      edit_history: undefined,
    }

    await upsertFact({ userKey: job.user_key, fact: memoryFact, ttlSeconds: MEMORY_TTL_SECONDS })
  }

  return { job_id: job.job_id, ok: true }
}
