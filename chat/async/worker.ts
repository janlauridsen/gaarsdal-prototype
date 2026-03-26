// chat/async/worker.ts
import type { AsyncJobResult, AsyncJobV23 } from "./types"
import { dequeueJobsWithStats } from "./queue"
import { readRawTurns } from "../raw/store"
import { createOpenAiCompatibleClient } from "../ai/provider"
import {
  readEpisode,
  readFacts,
  upsertEpisode,
  upsertFact,
  type MemoryFact,
  readTheme,
} from "../memory/longTermMemoryStore"
import { MEMORY_TTL_SECONDS } from "../utils/ttl"
import { nowMs } from "../utils/time"
import crypto from "crypto"

type ProcessBatchResult = {
  processed: number
  ok_count: number
  failed: number
  dropped: number
  results: AsyncJobResult[]
}

function getJsonModel(): string {
  return process.env.OPENAI_MODEL_JSON ?? "gpt-4o-mini"
}

// Stable fact_id based on episode + key — prevents duplicates across job runs
function stableFactId(episodeId: string, key: string): string {
  return crypto
    .createHash("sha256")
    .update(`${episodeId}:${key}`)
    .digest("hex")
    .slice(0, 24)
}

function clampStr(s: string, max: number): string {
  const t = (s ?? "").trim()
  return t.length <= max ? t : t.slice(0, max - 1) + "…"
}

function buildTranscriptExcerpt(
  turns: Awaited<ReturnType<typeof readRawTurns>>,
  maxTurns = 24,
  maxCharsPerTurn = 600
): string {
  return turns
    .slice(-maxTurns)
    .map((t) => {
      const u = t.user_input ? `U: ${clampStr(t.user_input, maxCharsPerTurn)}` : ""
      const a = t.assistant_output ? `A: ${clampStr(t.assistant_output, maxCharsPerTurn)}` : ""
      return [u, a].filter(Boolean).join("\n")
    })
    .filter(Boolean)
    .join("\n\n")
}

export async function processQueueBatch(limit: number): Promise<ProcessBatchResult> {
  const { jobs, dropped } = await dequeueJobsWithStats(limit)
  const results: AsyncJobResult[] = []

  for (const job of jobs) {
    results.push(await processJob(job))
  }

  const ok_count = results.filter((r) => r.ok).length
  const failed = results.length - ok_count

  return { processed: results.length, ok_count, failed, dropped, results }
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
  const turns = await readRawTurns({ conversationId: job.conversation_id })
  if (!turns.length) return { job_id: job.job_id, ok: true }

  const existing = await readEpisode({ userKey: job.user_key, episodeId: job.episode_id })
  const transcript = buildTranscriptExcerpt(turns, 24, 600)

  const llm = createOpenAiCompatibleClient()
  const model = getJsonModel()

  const system = `Du er et memory-modul for Gaarsdal Hypnoterapi's chatbot.
Din opgave er at opsummere en brugers samtaleforløb til brug i fremtidige samtaler.

Chatbotten hjælper brugere med at forstå hypnoterapi og afklare om det kan hjælpe dem.
Jan Gaarsdal er hypnoterapeut i Birkerød.

Returner KUN gyldig JSON:
{
  "summary_short": string,
  "open_loops": string[]
}

summary_short: 1-3 sætninger på dansk — hvad handler samtalen om, hvad søger brugeren.
open_loops: maks 4 uafklarede spørgsmål eller emner brugeren ikke fik svar på.

Regler:
- summary_short max 280 tegn
- Hvert open_loop max 120 tegn
- Skriv i 3. person ("brugeren søger...", "brugeren nævnte...")
- Ingen navne på brugeren
- Kun fakta støttet af transcript — ingen antagelser
- Returner tom open_loops-liste hvis ingen åbne emner er tydelige`

  const json = await llm.chatJson({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          episode_id: job.episode_id,
          previous_summary: existing?.summary_short ?? null,
          transcript,
        }),
      },
    ],
  })

  if (!json) return { job_id: job.job_id, ok: true }

  const summaryRaw = String((json as any)?.summary_short ?? "").trim()
  const openLoopsRaw = Array.isArray((json as any)?.open_loops)
    ? ((json as any).open_loops as any[])
        .filter((x) => typeof x === "string" && x.trim())
        .map((x) => clampStr(String(x), 120))
        .slice(0, 4)
    : []

  const summary_short = clampStr(summaryRaw, 280) || existing?.summary_short
  if (!summary_short && !openLoopsRaw.length) return { job_id: job.job_id, ok: true }

  const ts = nowMs()
  const episode = {
    episode_id: job.episode_id,
    theme_id: job.theme_id,
    started_at: existing?.started_at ?? ts,
    ended_at: existing?.ended_at,
    summary_short: summary_short ?? existing?.summary_short,
    open_loops: openLoopsRaw.length ? openLoopsRaw : existing?.open_loops,
    updated_at: ts,
  }

  await upsertEpisode({ userKey: job.user_key, episode, ttlSeconds: MEMORY_TTL_SECONDS })
  return { job_id: job.job_id, ok: true }
}

const ALLOWED_FACT_KEYS = new Set([
  "user.primary_concern",
  "user.motivation",
  "user.hypno_familiarity",
  "user.contact_intent",
  "user.preferred_approach",
  "prefs.tone",
  "triage.main_topic",
  "triage.subtopics",
])

// Facts at or above this threshold are promoted directly to canonical
const AUTO_PROMOTE_THRESHOLD = 0.82

async function processSuggestFacts(job: AsyncJobV23): Promise<AsyncJobResult> {
  const turns = await readRawTurns({ conversationId: job.conversation_id })
  if (!turns.length) return { job_id: job.job_id, ok: true }

  const episode = await readEpisode({ userKey: job.user_key, episodeId: job.episode_id })
  const theme = await readTheme({ userKey: job.user_key, themeId: job.theme_id })
  const transcript = buildTranscriptExcerpt(turns, 16, 500)

  const llm = createOpenAiCompatibleClient()
  const model = getJsonModel()

  const system = `Du er et memory-modul for Gaarsdal Hypnoterapi's chatbot.
Din opgave er at udtrække strukturerede facts om brugeren til fremtidig brug.

Chatbotten hjælper brugere med at forstå hypnoterapi og afklare om det kan hjælpe dem.

Returner KUN gyldig JSON:
{
  "facts": [
    { "key": string, "value": any, "confidence": number }
  ]
}

Tilladte nøgler (kun disse):
- user.primary_concern      // brugerens primære problem, fx "angst for flyvning", "søvnproblemer"
- user.motivation           // hvad driver brugeren, fx "vil gerne sove bedre"
- user.hypno_familiarity    // "none" | "curious" | "skeptical" | "tried_before"
- user.contact_intent       // "low" | "medium" | "high"
- user.preferred_approach   // "info_first" | "reflection_first" | "practical_first"
- prefs.tone                // "warm" | "direct" | "analytical"
- triage.main_topic         // kort label, maks 5 ord
- triage.subtopics          // string-array, maks 3

Regler:
- confidence: 0.0–1.0 — vær konservativ
- Medtag KUN facts med confidence >= 0.55
- value for user.* og triage.* skal være streng eller string-array
- Ingen antagelser — kun hvad transcript tydeligt understøtter
- Returner tom liste hvis intet er tydeligt`

  const json = await llm.chatJson({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: JSON.stringify({
          episode_id: job.episode_id,
          theme_label: theme?.label ?? null,
          episode_summary: episode?.summary_short ?? null,
          transcript,
        }),
      },
    ],
  })

  if (!json) return { job_id: job.job_id, ok: true }

  const factsArr = Array.isArray((json as any)?.facts) ? ((json as any).facts as any[]) : []
  const ts = nowMs()

  // Load existing facts once for deduplication by key
  const existingFacts = await readFacts({ userKey: job.user_key, limit: 500 })
  const existingByKey = new Map(existingFacts.map((f) => [f.key, f]))

  for (const f of factsArr) {
    const key = String(f?.key ?? "").trim()
    if (!key || !ALLOWED_FACT_KEYS.has(key)) continue

    const confidenceRaw = Number(f?.confidence ?? 0)
    const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0
    if (confidence < 0.55) continue

    const existing = existingByKey.get(key)

    // Don't downgrade a canonical fact with higher confidence
    if (existing?.status === "canonical" && (existing.confidence ?? 0) >= confidence) continue

    const autoPromote = confidence >= AUTO_PROMOTE_THRESHOLD
    const newStatus: MemoryFact["status"] = autoPromote ? "canonical" : "suggested"

    const fact_id = stableFactId(job.episode_id, key)
    const valueChanged = existing && JSON.stringify(existing.value) !== JSON.stringify((f as any)?.value)

    const memoryFact: MemoryFact = {
      fact_id,
      key,
      value: (f as any)?.value,
      status: newStatus,
      confidence,
      created_at: existing?.created_at ?? ts,
      updated_at: ts,
      provenance: {
        created_by: "worker:suggest-facts-v1",
        last_edited_by: existing ? "worker:suggest-facts-v1:update" : undefined,
      },
      edit_history:
        valueChanged
          ? [
              ...(existing.edit_history ?? []),
              {
                ts,
                editor: "worker:suggest-facts-v1",
                prev_value: existing.value,
                next_value: (f as any)?.value,
              },
            ].slice(-10)
          : existing?.edit_history,
    }

    await upsertFact({ userKey: job.user_key, fact: memoryFact, ttlSeconds: MEMORY_TTL_SECONDS })
  }

  return { job_id: job.job_id, ok: true }
}
