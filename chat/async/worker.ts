// chat/async/worker.ts
import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobsWithStats } from "./queue"
import { readInteractions } from "../logging/sink"
import { createOpenAiCompatibleClient } from "../ai/provider"
import { readReflectionCase, writeReflectionCase } from "../persistence/reflectionCaseStore"
import { mergeReflectionCase } from "../reflection/merge"
import {
  readEpisode,
  readFacts,
  readThemes,
  upsertTheme,
  upsertEpisode,
  upsertFact,
  type MemoryFact,
  readTheme,
} from "../memory/longTermMemoryStore"
import { readConversationState } from "../persistence/conversationStateStore"

const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // keep aligned with other memory TTLs for now
const REFLECTION_TTL_SECONDS = 90 * 24 * 60 * 60

const CBA_PROMPT_V1 =
  "Role: Case Builder Agent.\n\n" +
  "Input:\n- current_schema\n- user_message\n- therapist_message\n\n" +
  "Rules:\n" +
  "- Extract only explicit or strongly implied data.\n" +
  "- Update confidence conservatively.\n" +
  "- Compute maturity_model using rule-based coverage.\n" +
  "- Compute risk_engine using explicit behavioral signals.\n" +
  "- Compute dialog_dynamics baseline (novelty).\n" +
  "- Estimate repetition_score and fatigue_signal (±0.15 cap).\n" +
  "- Merge to progress_score.\n" +
  "- Detect stall if progress_score < 0.25 for 3 turns.\n" +
  "- Never propose exercises or interventions.\n" +
  "- If override_active = true, signal stabilization.\n\n" +
  "Output strictly JSON:\n" +
  "- schema updates\n" +
  "- updated risk_engine\n" +
  "- maturity_model\n" +
  "- dialog_dynamics\n" +
  "- suggestions_for_therapist\n"

type ProcessBatchResult = {
  processed: number
  ok_count: number
  failed: number
  dropped: number
  results: AsyncJobResult[]
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
    if (job.type === "REFLECTION_CBA_UPDATE") return await processReflectionCbaUpdate(job)

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
  const interactions = await readInteractions(job.conversation_id)

  // Fix: readThemes/readFacts expect { userKey, limit? }
  const themes = await readThemes({ userKey: job.user_key })
  const facts = await readFacts({ userKey: job.user_key })

  const llm = createOpenAiCompatibleClient()

  const prompt =
    "Summarize the user's episode for long-term memory.\n" +
    "Return JSON with fields: { theme_title, theme_summary, episode_title, episode_summary }.\n"

  const json = await llm.chatJson({
    system: prompt,
    user: JSON.stringify({
      conversation_id: job.conversation_id,
      episode_id: job.episode_id,
      interactions,
      themes,
      facts,
      active_node: state.active_node,
    }),
  })

  const themeTitle = String((json as any)?.theme_title ?? "").trim()
  const themeSummary = String((json as any)?.theme_summary ?? "").trim()
  const episodeTitle = String((json as any)?.episode_title ?? "").trim()
  const episodeSummary = String((json as any)?.episode_summary ?? "").trim()

  if (themeTitle && themeSummary) {
    await upsertTheme(job.user_key, {
      theme_id: job.theme_id,
      title: themeTitle,
      summary: themeSummary,
      updated_at_ms: Date.now(),
    })
  }

  if (episodeTitle && episodeSummary) {
    await upsertEpisode(job.user_key, {
      theme_id: job.theme_id,
      episode_id: job.episode_id,
      title: episodeTitle,
      summary: episodeSummary,
      updated_at_ms: Date.now(),
    })
  }

  return { job_id: job.job_id, ok: true }
}

async function processSuggestFacts(job: AsyncJobV23): Promise<AsyncJobResult> {
  const theme = await readTheme(job.user_key, job.theme_id)
  const episode = await readEpisode(job.user_key, job.theme_id, job.episode_id)

  // Fix: readInteractions in this repo takes (conversation_id?: string)
  // We use conversation_id because it's the canonical scope for interactions in the logging sink.
  const interactions = await readInteractions(job.conversation_id)

  const llm = createOpenAiCompatibleClient()

  const prompt =
    "Extract candidate memory facts from the episode.\n" +
    "Return JSON: { facts: [{ type, content, confidence }] }.\n"

  const json = await llm.chatJson({
    system: prompt,
    user: JSON.stringify({
      theme,
      episode,
      interactions,
    }),
  })

  const facts = Array.isArray((json as any)?.facts) ? ((json as any).facts as any[]) : []
  for (const f of facts) {
    const content = String(f?.content ?? "").trim()
    const type = String(f?.type ?? "note").trim()
    const confidence = Number(f?.confidence ?? 0.0)
    if (!content) continue

    const memoryFact: MemoryFact = {
      fact_id: `${job.episode_id}:${Math.random().toString(16).slice(2)}`,
      type,
      content,
      confidence: Number.isFinite(confidence) ? confidence : 0.0,
      created_at_ms: Date.now(),
    }
    await upsertFact(job.user_key, memoryFact)
  }

  return { job_id: job.job_id, ok: true }
}

async function processReflectionCbaUpdate(job: AsyncJobV23): Promise<AsyncJobResult> {
  const payload = job.payload
  if (!payload || typeof payload.user_message !== "string" || typeof payload.therapist_message !== "string") {
    return {
      job_id: job.job_id,
      ok: false,
      error: { code: "missing_payload", message: "Missing payload for REFLECTION_CBA_UPDATE" },
    }
  }

  const current = await readReflectionCase(job.conversation_id)
  const llm = createOpenAiCompatibleClient()

  const json = await llm.chatJson({
    system: CBA_PROMPT_V1,
    user: JSON.stringify({
      current_schema: current,
      user_message: payload.user_message,
      therapist_message: payload.therapist_message,
    }),
  })

  const patchCandidate =
    (json as any)?.schema_updates ??
    (json as any)?.schema ??
    (json as any)?.patch ??
    (json as any)?.updates ??
    json

  const merged = mergeReflectionCase(current, patchCandidate as any)

  const suggestions = (json as any)?.suggestions_for_therapist
  if (typeof suggestions === "string" && suggestions.trim().length > 0) {
    ;(merged as any).suggestions_for_therapist = suggestions.trim()
  }

  await writeReflectionCase(job.conversation_id, merged as any, REFLECTION_TTL_SECONDS)

  return { job_id: job.job_id, ok: true }
}
