import { createOpenAiCompatibleClient } from "../../ai/provider"
import { readThreadIndex } from "../../persistence/threadIndexStore"
import { ensureThreadThemeAndEpisode } from "../../memory/longTermMemoryStore"
import { readRawTurns } from "../../raw/store"
import { jobsTtlSeconds, writeDraft, writeJob } from "../store"
import { DraftV1, EvidenceRefV1, JobRecordV1, ScanThreadsPayload } from "../types"

type ThreadSummary = {
  conversation_id: string
  title: string
  updated_at: string
  summary_short: string
}

function nowMs(): number {
  return Date.now()
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === "string") as string[]
}

function safeLines(input: string, max = 6): string {
  const one = input.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim()
  if (!one) return ""
  const parts = one.split(" ")
  return parts.slice(0, max * 20).join(" ")
}

async function shortlistThreads(params: {
  userKey: string
  activeConversationId: string
  maxThreads: number
  ttlSeconds: number
}): Promise<ThreadSummary[]> {
  const idx = await readThreadIndex(params.userKey)
  const threads = idx?.threads ?? []
  const sorted = [...threads]
    .filter((t) => t.status !== "archived")
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, params.maxThreads)

  const out: ThreadSummary[] = []
  for (const t of sorted) {
    // Do not include the currently active conversation unless it is explicitly in the index.
    const convId = t.conversation_id
    const { episode } = await ensureThreadThemeAndEpisode({
      userKey: params.userKey,
      conversationId: convId,
      ttlSeconds: params.ttlSeconds,
    })
    out.push({
      conversation_id: convId,
      title: t.title,
      updated_at: t.updated_at,
      summary_short: asString(episode.summary_short),
    })
  }
  return out
}

async function llmSelectThreads(params: {
  payload: ScanThreadsPayload
  candidates: ThreadSummary[]
  maxPick: number
}): Promise<string[]> {
  const llm = createOpenAiCompatibleClient()
  const problem = params.payload.problem

  const candidateText = params.candidates
    .map((c) => {
      const s = c.summary_short ? safeLines(c.summary_short, 8) : "(no summary yet)"
      return `- conversation_id: ${c.conversation_id}\n  title: ${safeLines(c.title, 2)}\n  updated_at: ${c.updated_at}\n  summary_short: ${s}`
    })
    .join("\n")

  const system =
    "You are selecting which previous conversation threads are relevant to a user's current problem. " +
    "Return strict JSON with key 'selected' as an array of conversation_id strings."

  const user =
    `Problem:\n` +
    `title: ${problem.problem_title}\n` +
    `description: ${problem.problem_description}\n` +
    `tags: ${(problem.topic_tags ?? []).join(", ")}\n` +
    `time_scope: ${problem.time_scope ?? ""}\n` +
    `intent: ${problem.search_intent ?? ""}\n\n` +
    `Candidates:\n${candidateText}\n\n` +
    `Select up to ${params.maxPick} conversation_id values that most likely contain reusable relevant information.`

  const json = await llm.chatJson({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })

  const selected = asStringArray(json?.selected)
  return selected.slice(0, params.maxPick)
}

async function llmBuildDraft(params: {
  payload: ScanThreadsPayload
  deep: Array<{ conversation_id: string; excerpt: string; revision_from?: number; revision_to?: number }>
}): Promise<{ summary: string; open_questions: string[]; evidence: EvidenceRefV1[] } | null> {
  const llm = createOpenAiCompatibleClient()
  const problem = params.payload.problem

  const context = params.deep
    .map((d) => {
      return `THREAD ${d.conversation_id} (revisions ${d.revision_from ?? "?"}-${d.revision_to ?? "?"}):\n${d.excerpt}`
    })
    .join("\n\n")

  const system =
    "You are producing a reuse summary from past conversation threads. " +
    "Return strict JSON with keys: summary_draft (string), open_questions (array of strings), evidence (array). " +
    "Each evidence item must include conversation_id and may include revision_from and revision_to."

  const user =
    `Current problem:\n` +
    `title: ${problem.problem_title}\n` +
    `description: ${problem.problem_description}\n\n` +
    `Past excerpts:\n${context}\n\n` +
    "Write a concise draft summary of reusable relevant information. " +
    "Add open questions for the user to confirm/correct. " +
    "Do NOT assume facts not supported by the excerpts."

  const json = await llm.chatJson({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  })
  if (!json) return null

  const summary = asString((json as any).summary_draft)
  const open_questions = asStringArray((json as any).open_questions)
  const evidenceRaw = Array.isArray((json as any).evidence) ? ((json as any).evidence as any[]) : []
  const evidence: EvidenceRefV1[] = evidenceRaw
    .filter((e) => e && typeof e === "object")
    .map((e) => ({
      conversation_id: asString((e as any).conversation_id),
      revision_from: typeof (e as any).revision_from === "number" ? (e as any).revision_from : undefined,
      revision_to: typeof (e as any).revision_to === "number" ? (e as any).revision_to : undefined,
      note: typeof (e as any).note === "string" ? (e as any).note : undefined,
    }))
    .filter((e) => !!e.conversation_id)

  if (!summary) return null
  return { summary, open_questions, evidence }
}

export async function tickScanThreads(job: JobRecordV1): Promise<{ job: JobRecordV1; completed: boolean }> {
  const ttlSeconds = jobsTtlSeconds()
  const payload = job.payload as unknown as ScanThreadsPayload

  const limits = payload?.limits ?? {}
  const maxThreads = clamp(typeof limits.max_threads === "number" ? limits.max_threads : 10, 1, 25)
  const maxDeepDive = clamp(typeof limits.max_threads_deep_dive === "number" ? limits.max_threads_deep_dive : 3, 1, 8)
  const rawTurnsLimit = clamp(typeof limits.raw_turns_per_thread === "number" ? limits.raw_turns_per_thread : 40, 5, 200)

  const updatedBase: JobRecordV1 = {
    ...job,
    attempts: (job.attempts ?? 0) + 1,
    updated_at: nowMs(),
  }

  try {
    if (job.status === "queued") {
      const next: JobRecordV1 = {
        ...updatedBase,
        status: "running",
        cursor: "SHORTLIST",
        progress: 0.05,
        work: {},
      }
      await writeJob(next, ttlSeconds)
      return { job: next, completed: false }
    }

    if (job.status !== "running") {
      return { job: updatedBase, completed: job.status === "completed" || job.status === "failed" || job.status === "canceled" }
    }

    const cursor = job.cursor ?? "INIT"
    const work = (job.work ?? {}) as Record<string, unknown>

    if (cursor === "SHORTLIST") {
      const candidates = await shortlistThreads({
        userKey: job.user_key,
        activeConversationId: job.conversation_id,
        maxThreads,
        ttlSeconds,
      })
      const next: JobRecordV1 = {
        ...updatedBase,
        cursor: "SELECT",
        progress: 0.2,
        work: {
          ...work,
          candidates,
        },
      }
      await writeJob(next, ttlSeconds)
      return { job: next, completed: false }
    }

    if (cursor === "SELECT") {
      const candidates = (work.candidates as any[]) ?? []
      const typed: ThreadSummary[] = candidates
        .filter((c) => c && typeof c === "object")
        .map((c) => ({
          conversation_id: asString((c as any).conversation_id),
          title: asString((c as any).title),
          updated_at: asString((c as any).updated_at),
          summary_short: asString((c as any).summary_short),
        }))
        .filter((c) => !!c.conversation_id)

      let selected: string[] = []
      // If no API key, fall back to most recent.
      if (!process.env.OPENAI_API_KEY) {
        selected = typed.slice(0, maxDeepDive).map((t) => t.conversation_id)
      } else {
        selected = await llmSelectThreads({ payload, candidates: typed, maxPick: maxDeepDive })
        if (selected.length === 0) selected = typed.slice(0, maxDeepDive).map((t) => t.conversation_id)
      }

      const next: JobRecordV1 = {
        ...updatedBase,
        cursor: "DEEP_DIVE",
        progress: 0.35,
        work: {
          ...work,
          selected,
        },
      }
      await writeJob(next, ttlSeconds)
      return { job: next, completed: false }
    }

    if (cursor === "DEEP_DIVE") {
      const selected = asStringArray(work.selected)
      const deep: Array<{ conversation_id: string; excerpt: string; revision_from?: number; revision_to?: number }> = []

      for (const convId of selected.slice(0, maxDeepDive)) {
        const turns = await readRawTurns({ conversationId: convId, limit: rawTurnsLimit })
        const excerpt = turns
          .map((t) => {
            const u = t.user_input ? `U: ${safeLines(t.user_input, 2)}` : ""
            const a = t.assistant_output ? `A: ${safeLines(t.assistant_output, 2)}` : ""
            return [u, a].filter(Boolean).join("\n")
          })
          .filter(Boolean)
          .join("\n\n")

        const revisions = turns.map((t) => t.revision).filter((n) => typeof n === "number")
        const revision_from = revisions.length ? Math.min(...revisions) : undefined
        const revision_to = revisions.length ? Math.max(...revisions) : undefined
        deep.push({ conversation_id: convId, excerpt: excerpt.slice(0, 6000), revision_from, revision_to })
      }

      const next: JobRecordV1 = {
        ...updatedBase,
        cursor: "BUILD_DRAFT",
        progress: 0.65,
        work: {
          ...work,
          deep,
        },
      }
      await writeJob(next, ttlSeconds)
      return { job: next, completed: false }
    }

    if (cursor === "BUILD_DRAFT") {
      const deep = Array.isArray(work.deep) ? (work.deep as any[]) : []
      const typed = deep
        .filter((d) => d && typeof d === "object")
        .map((d) => ({
          conversation_id: asString((d as any).conversation_id),
          excerpt: asString((d as any).excerpt),
          revision_from: typeof (d as any).revision_from === "number" ? (d as any).revision_from : undefined,
          revision_to: typeof (d as any).revision_to === "number" ? (d as any).revision_to : undefined,
        }))
        .filter((d) => !!d.conversation_id)

      let draft: { summary: string; open_questions: string[]; evidence: EvidenceRefV1[] } | null = null
      if (process.env.OPENAI_API_KEY) {
        draft = await llmBuildDraft({ payload, deep: typed })
      }

      if (!draft) {
        // Fallback: deterministic minimal draft.
        const ids = typed.map((d) => d.conversation_id)
        const summary =
          `Jeg har fundet tidligere tråde der potentielt er relevante: ${ids.join(", ")}. ` +
          `Jeg kan lave en bedre opsummering når der findes tråd-summaries eller når LLM er tilgængelig.`
        draft = {
          summary,
          open_questions: ["Vil du kort opsummere hvad der tidligere var vigtigt?"],
          evidence: typed.map((d) => ({
            conversation_id: d.conversation_id,
            revision_from: d.revision_from,
            revision_to: d.revision_to,
          })),
        }
      }

      const draftObj: DraftV1 = {
        schema_version: "v1",
        job_id: job.job_id,
        conversation_id: job.conversation_id,
        kind: "scan_threads",
        summary_draft: draft.summary,
        evidence: draft.evidence,
        open_questions: draft.open_questions,
        created_at: nowMs(),
      }

      const resultRef = await writeDraft(draftObj, ttlSeconds)
      const next: JobRecordV1 = {
        ...updatedBase,
        status: "completed",
        cursor: "DONE",
        progress: 1,
        result_ref: resultRef,
      }
      await writeJob(next, ttlSeconds)
      return { job: next, completed: true }
    }

    // Unknown cursor
    const failed: JobRecordV1 = {
      ...updatedBase,
      status: "failed",
      last_error: `unknown cursor: ${cursor}`,
    }
    await writeJob(failed, ttlSeconds)
    return { job: failed, completed: true }
  } catch (e: any) {
    const failed: JobRecordV1 = {
      ...updatedBase,
      status: "failed",
      last_error: typeof e?.message === "string" ? e.message : "job failed",
    }
    await writeJob(failed, ttlSeconds)
    return { job: failed, completed: true }
  }
}
