// chat/async/worker.ts
import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobs } from "./queue"
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
  "Output strictly JSON with:\n" +
  "- schema updates\n" +
  "- updated risk_engine\n" +
  "- maturity_model\n" +
  "- dialog_dynamics\n" +
  "- suggestions_for_therapist\n"

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x)
}

function pickSchemaPatch(out: Record<string, unknown>): Record<string, unknown> {
  // Spec does not define canonical key names.
  // We accept a few common envelopes to avoid brittle coupling:
  // - { schema_updates: {...} }
  // - { schema: {...} }
  // - { patch: {...} }
  // - otherwise treat the object itself as a patch.
  const candidates = ["schema_updates", "schema", "patch", "updates"]
  for (const k of candidates) {
    const v = out[k]
    if (isRecord(v)) return v
  }
  return out
}

function pickSuggestions(out: Record<string, unknown>): string {
  const v = out["suggestions_for_therapist"]
  return typeof v === "string" ? v : ""
}

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

function stableEpisodeId(params: { themeId: string }): string {
  // deterministic single episode per theme for v23 iteration 1
  return `episode:${params.themeId}:1`
}

function stableThemeId(raw: string): string {
  const base = (raw ?? "").trim().toLowerCase()
  if (!base) return "general"
  // allow a-z0-9 and dash/underscore
  return base.replace(/[^a-z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "general"
}

function themeLabel(themeId: string): string {
  if (themeId === "alkohol") return "Alkohol"
  if (themeId === "general") return "Generelt"
  // fallback: title-case-ish
  return themeId.charAt(0).toUpperCase() + themeId.slice(1)
}

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0
}

function readMetaValue(state: any, key: string): unknown {
  const entry = state?.meta?.[key]
  if (!entry || typeof entry !== "object") return undefined
  return (entry as any).value
}

function asStringArray(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  const out = value
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, limit)
  return out
}

async function upsertCanonicalFact(params: {
  userKey: string
  key: string
  value: any
  confidence?: number
  createdBy: string
}): Promise<void> {
  const existing = await readFacts({ userKey: params.userKey, limit: 500 })
  const rejected = existing.some((f) => f.key === params.key && f.status === "rejected")
  if (rejected) return

  const fact_id = stableFactId({ userKey: params.userKey, key: params.key })
  const ts = nowMs()
  const prior = existing.find((f) => f.fact_id === fact_id)

  const fact: MemoryFact = {
    fact_id,
    key: params.key,
    value: params.value,
    status: "canonical",
    confidence: typeof params.confidence === "number" ? params.confidence : prior?.confidence,
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

async function ensureThemeAndEpisode(params: {
  userKey: string
  themeId: string
  origin: "user_selected" | "system_suggested" | "imported"
}): Promise<{ themeId: string; episodeId: string }> {
  const themeId = stableThemeId(params.themeId)
  const ts = nowMs()

  const themes = await readThemes({ userKey: params.userKey, limit: 50 })
  const existing = themes.find((t) => t.theme_id === themeId)

  await upsertTheme({
    userKey: params.userKey,
    ttlSeconds: MEMORY_TTL_SECONDS,
    theme: {
      theme_id: themeId,
      label: existing?.label ?? themeLabel(themeId),
      status: "active",
      created_at: existing?.created_at ?? ts,
      updated_at: ts,
      origin: existing?.origin ?? params.origin,
    },
  })

  const episodeId = stableEpisodeId({ themeId })
  const existingEpisode = await readEpisode({ userKey: params.userKey, episodeId })

  if (!existingEpisode) {
    await upsertEpisode({
      userKey: params.userKey,
      ttlSeconds: MEMORY_TTL_SECONDS,
      episode: {
        episode_id: episodeId,
        theme_id: themeId,
        started_at: ts,
        updated_at: ts,
      },
    })
  } else {
    // touch updated_at to keep theme “fresh” for context selection
    await upsertEpisode({
      userKey: params.userKey,
      ttlSeconds: MEMORY_TTL_SECONDS,
      episode: {
        ...existingEpisode,
        updated_at: ts,
      },
    })
  }

  return { themeId, episodeId }
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
  // Cross-thread contamination guardrail:
  // Summaries MUST be written to the thread-bound episode_id.
  let episodeId = job.episode_id
  if (!episodeId) {
    const state = await readConversationState(job.conversation_id)
    const bound = (state?.meta?.["thread.episode_id"] as any)?.value
    if (typeof bound === "string") episodeId = bound
  }
  if (!episodeId) return { job_id: job.job_id, ok: true }

  const episode = await readEpisode({ userKey: job.user_key, episodeId })
  if (!episode) return { job_id: job.job_id, ok: true }

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

  // Cross-thread contamination guardrail:
  // Facts and theme/episode updates MUST target the thread-bound theme/episode.
  const boundThemeId = job.theme_id ?? (state.meta?.["thread.theme_id"] as any)?.value
  const boundEpisodeId = job.episode_id ?? (state.meta?.["thread.episode_id"] as any)?.value
  if (typeof boundThemeId !== "string" || typeof boundEpisodeId !== "string") {
    return { job_id: job.job_id, ok: true }
  }

  // Ensure theme + episode exist (idempotent).
  const ts = nowMs()
  const existingTheme = await readTheme({ userKey: job.user_key, themeId: boundThemeId })

  // Optional label update from memory_candidates.theme (label only; never changes theme_id).
  const themeCandidate = readMetaValue(state, "memory_candidates.theme")
  const candidateLabel =
    themeCandidate && typeof themeCandidate === "object" && themeCandidate !== null && typeof (themeCandidate as any).id === "string"
      ? String((themeCandidate as any).id)
      : ""

  await upsertTheme({
    userKey: job.user_key,
    ttlSeconds: MEMORY_TTL_SECONDS,
    theme: {
      theme_id: boundThemeId,
      label: clampText(candidateLabel, 64) || existingTheme?.label || "Tråd",
      status: "active",
      created_at: existingTheme?.created_at ?? ts,
      updated_at: ts,
      origin: existingTheme?.origin ?? "system_suggested",
    },
  })

  const existingEpisode = await readEpisode({ userKey: job.user_key, episodeId: boundEpisodeId })
  await upsertEpisode({
    userKey: job.user_key,
    ttlSeconds: MEMORY_TTL_SECONDS,
    episode: existingEpisode
      ? { ...existingEpisode, theme_id: boundThemeId, updated_at: ts }
      : {
          episode_id: boundEpisodeId,
          theme_id: boundThemeId,
          started_at: ts,
          updated_at: ts,
        },
  })

  // --- Iteration 1: memory_candidates → theme/episode + canonical facts ---
  {
    const goalObj = readMetaValue(state, "memory_candidates.goal")
    const goalText =
      typeof goalObj === "string"
        ? goalObj
        : goalObj && typeof goalObj === "object" && goalObj !== null && typeof (goalObj as any).text === "string"
          ? (goalObj as any).text
          : ""

    const triggers = asStringArray(readMetaValue(state, "memory_candidates.triggers"), 10)
    const patterns = asStringArray(readMetaValue(state, "memory_candidates.patterns"), 10)
    const summary = readMetaValue(state, "memory_candidates.summary")

    const createdBy = `job:${job.type}:${job.job_version}`
    const conf =
      themeCandidate && typeof themeCandidate === "object" && themeCandidate !== null && typeof (themeCandidate as any).confidence === "number"
        ? (themeCandidate as any).confidence
        : undefined

    if (isNonEmptyString(goalText)) {
      await upsertCanonicalFact({
        userKey: job.user_key,
        key: `theme.${boundThemeId}.goal`,
        value: goalText.trim(),
        confidence: conf,
        createdBy,
      })
    }

    if (triggers.length) {
      await upsertCanonicalFact({
        userKey: job.user_key,
        key: `theme.${boundThemeId}.key_triggers`,
        value: triggers,
        confidence: conf,
        createdBy,
      })
    }

    if (patterns.length) {
      await upsertCanonicalFact({
        userKey: job.user_key,
        key: `theme.${boundThemeId}.patterns`,
        value: patterns,
        confidence: conf,
        createdBy,
      })
    }

    if (typeof summary === "string" && summary.trim()) {
      // Episode summary is the most useful “no repetition” anchor.
      const episode = await readEpisode({ userKey: job.user_key, episodeId: boundEpisodeId })
      if (episode) {
        await upsertEpisode({
          userKey: job.user_key,
          ttlSeconds: MEMORY_TTL_SECONDS,
          episode: {
            ...episode,
            summary_short: clampText(summary, 520),
            updated_at: nowMs(),
          },
        })
      }
    }
  }

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
      key: `theme.${boundThemeId}.last_topic`,
      value: lastTopic.trim(),
      createdBy: `job:${job.type}:${job.job_version}`,
    })
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
  const model = process.env.OPENAI_MODEL_JSON ?? "gpt-4o-mini"

  const inputObj = {
    current_schema: current,
    user_message,
    therapist_message,
  }

  const out = await llm.chatJson({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CBA_PROMPT_V1 },
      { role: "user", content: JSON.stringify(inputObj) },
    ],
  })

  if (!out) {
    // If LLM is unavailable (no API key) we treat as successful no-op.
    return { job_id: job.job_id, ok: true }
  }

  const patch = pickSchemaPatch(out)
  const suggestions = pickSuggestions(out)

  const merged = mergeReflectionCase(current, patch as any)
  if (suggestions) (merged as any).suggestions_for_therapist = suggestions

  await writeReflectionCase(job.conversation_id, merged as any, REFLECTION_TTL_SECONDS)
  return { job_id: job.job_id, ok: true }
}

export async function processJob(job: AsyncJobV23): Promise<AsyncJobResult> {
  try {
    if (job.type === "SUMMARIZE_EPISODE") return await processSummarizeEpisode(job)
    if (job.type === "SUGGEST_FACTS") return await processSuggestFacts(job)
    if (job.type === "REFLECTION_CBA_UPDATE") return await processReflectionCbaUpdate(job)

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
