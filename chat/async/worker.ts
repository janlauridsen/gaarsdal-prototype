import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobs } from "./queue"
import { readInteractions } from "../logging/sink"
import { ensureDefaultThemeAndEpisode, readEpisode, upsertEpisode } from "../memory/longTermMemoryStore"

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

export async function processJob(job: AsyncJobV23): Promise<AsyncJobResult> {
  try {
    if (job.type !== "SUMMARIZE_EPISODE") {
      return { job_id: job.job_id, ok: false, error: { code: "UNKNOWN_JOB", message: `Unknown type: ${job.type}` } }
    }

    // Ensure default theme/episode exists (bridge until theme-selection UI exists).
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
