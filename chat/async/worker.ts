// chat/async/worker.ts
import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobsWithStats } from "./queue"
import { readRawTurns } from "../raw/store"
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
  type Theme,
  type Episode,
} from "../memory/longTermMemoryStore"
import { readConversationState } from "../persistence/conversationStateStore"
import { writeReflectionFocusPlan } from "../persistence/reflectionFocusPlanStore"
import type { ReflectionFocusPlanV1 } from "../reflection/focusPlan"

const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // keep aligned with other memory TTLs for now
const REFLECTION_TTL_SECONDS = 90 * 24 * 60 * 60

const CBA_PROMPT_V1 =
  "Role: Case Builder Agent.\n\n" +
  "Input:\n- current_schema\n- user_message\n- therapist_message\n\n" +
  "Rules:\n" +
  "- Extract only explicit or strongly implied data.\n" +
  "- Track the user's own key words (e.g. 'resignation', 'håbløshed', 'ligeglad') as signals in dialog_dynamics when they are clearly present.\n" +
  "- Detect and represent change talk (concern, desire, reasons, need, commitment) conservatively when explicitly present.\n" +
  "- Detect ambivalence when both sides are expressed (wanting change AND wanting relief).\n" +
  "- Acknowledge prior attempts (e.g. tried to cut down) as agency signals if stated.\n" +
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

const FOCUS_PLAN_PROMPT_V1 =
  "Role: Reflection Focus Planner.\n\n" +
  "Goal:\n" +
  "- Select 1–3 highest-priority fields from the reflection schema to clarify next.\n" +
  "- Provide 1–3 natural, human questions the dialogue partner can ask to reduce uncertainty.\n\n" +
  "You receive:\n" +
  "- current_schema (JSON)\n" +
  "- conversation_transcript (list of {role, content})\n" +
  "- latest_user_message (string)\n\n" +
  "Prioritization:\n" +
  "- Prefer fields with high uncertainty AND high downstream impact.\n" +
  "- Prefer fields that unblock understanding of the user's goal and constraints.\n" +
  "- Prefer safety/urgency only if explicitly signaled.\n" +
  "- Avoid repeating recent questions (use transcript).\n\n" +
  "Rules:\n" +
  "- Pick at most 3 focus fields. It is OK to return fewer (including 0) if there is no meaningful gap.\n" +
  "- Questions must be short, Danish, and non-robotic.\n" +
  "- Do NOT mention schema field names or internal structures.\n" +
  "- Do NOT propose exercises or structured interventions.\n\n" +
  "Return ONLY valid JSON in this shape:\n" +
  "{\n" +
  '  "focus_fields": [{ "path": string, "reason": string, "priority": 1|2|3 }],\n' +
  '  "suggested_questions": [{ "field_path": string, "question": string }],\n' +
  '  "constraints": { "max_questions": 1|2|3, "avoid_repeat_within_turns": number }\n' +
  "}\n"

type ProcessBatchResult = {
  processed: number
  ok_count: number
  failed: number
  dropped: number
  results: AsyncJobResult[]
}

function nowMs(): number {
  return Date.now()
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

async function processReflectionCbaUpdate(job: AsyncJobV23): Promise<AsyncJobResult> {
  const payload = (job as any).payload
  const user_message = typeof payload?.user_message === "string" ? payload.user_message : ""
  const therapist_message = typeof payload?.therapist_message === "string" ? payload.therapist_message : ""

  // No-op if we do not have any meaningful text.
  if (!user_message.trim() && !therapist_message.trim()) {
    return { job_id: job.job_id, ok: true }
  }

  const current = await readReflectionCase(job.conversation_id)
  const llm = createOpenAiCompatibleClient()
  const model = getJsonModel()

  const out = await llm.chatJson({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CBA_PROMPT_V1 },
      {
        role: "user",
        content: JSON.stringify({
          current_schema: current,
          user_message,
          therapist_message,
        }),
      },
    ],
  })

  if (!out) return { job_id: job.job_id, ok: true }

  const patchCandidate =
    (out as any)?.schema_updates ??
    (out as any)?.schema ??
    (out as any)?.patch ??
    (out as any)?.updates ??
    out

  const merged = mergeReflectionCase(current, patchCandidate as any)

  const suggestions = (out as any)?.suggestions_for_therapist
  if (typeof suggestions === "string" && suggestions.trim().length > 0) {
    ;(merged as any).suggestions_for_therapist = suggestions.trim()
  }

  await writeReflectionCase(job.conversation_id, merged as any, REFLECTION_TTL_SECONDS)

  // Generate an ephemeral focus plan (1–3 fields + 1–3 questions) for the next dialogue turn.
  // Stored separately from the schema to avoid polluting long-lived case data.
  try {
    const state = await readConversationState(job.conversation_id)
    const transcript = (state?.meta?.["reflection.transcript"]?.value as any) ?? []
    const focusOut = await llm.chatJson({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: FOCUS_PLAN_PROMPT_V1 },
        {
          role: "user",
          content: JSON.stringify({
            current_schema: merged,
            conversation_transcript: transcript,
            latest_user_message: user_message,
          }),
        },
      ],
    })

    if (focusOut) {
      const rawFields = Array.isArray((focusOut as any).focus_fields) ? (focusOut as any).focus_fields : []
      const rawQuestions = Array.isArray((focusOut as any).suggested_questions)
        ? (focusOut as any).suggested_questions
        : []
      const maxQ =
        (focusOut as any)?.constraints?.max_questions === 1 ||
        (focusOut as any)?.constraints?.max_questions === 2 ||
        (focusOut as any)?.constraints?.max_questions === 3
          ? (focusOut as any).constraints.max_questions
          : 2

      const avoidRepeat =
        typeof (focusOut as any)?.constraints?.avoid_repeat_within_turns === "number"
          ? (focusOut as any).constraints.avoid_repeat_within_turns
          : 3

      const plan: ReflectionFocusPlanV1 = {
        version: "v1",
        conversation_id: job.conversation_id,
        episode_id: job.episode_id,
        revision: job.revision_after,
        focus_fields: rawFields
          .slice(0, 3)
          .map((f: any, i: number) => ({
            path: typeof f?.path === "string" ? f.path : "",
            reason: typeof f?.reason === "string" ? f.reason : "",
            priority: (f?.priority === 1 || f?.priority === 2 || f?.priority === 3 ? f.priority : (i + 1)) as
              | 1
              | 2
              | 3,
          }))
          .filter((f: any) => f.path && f.reason),
        suggested_questions: rawQuestions
          .slice(0, 3)
          .map((q: any) => ({
            field_path: typeof q?.field_path === "string" ? q.field_path : "",
            question: typeof q?.question === "string" ? q.question : "",
          }))
          .filter((q: any) => q.field_path && q.question),
        constraints: { max_questions: maxQ, avoid_repeat_within_turns: avoidRepeat },
        created_at: new Date().toISOString(),
      }

      // Keep aligned with other reflection TTLs but shorter is fine; this is ephemeral guidance.
      const FOCUS_PLAN_TTL_SECONDS = 24 * 60 * 60
      await writeReflectionFocusPlan(job.conversation_id, job.revision_after, plan, FOCUS_PLAN_TTL_SECONDS)
    }
  } catch {
    // Focus plan is best-effort; it must never fail the job.
  }

  return { job_id: job.job_id, ok: true }
}
