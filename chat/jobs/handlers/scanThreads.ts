import { createOpenAiCompatibleClient } from "../../ai/provider"
import { readThreadIndex } from "../../persistence/threadIndexStore"
import { ensureThreadThemeAndEpisode } from "../../memory/longTermMemoryStore"
import { readRawTurns } from "../../raw/store"
import { jobsTtlSeconds, writeDraft, writeJob } from "../store"
import { DraftV1, EvidenceRefV1, JobRecordV1, ScanThreadsPayload } from "../types"

type ThreadSummary = {
  conversation_id: string
  title: string
  preview: string
  updated_at: string
  summary_short: string
  lexical_score?: number
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


const STOPWORDS = new Set([
  "og",
  "i",
  "på",
  "paa",
  "for",
  "til",
  "af",
  "at",
  "om",
  "er",
  "det",
  "der",
  "de",
  "en",
  "et",
  "den",
  "som",
  "med",
  "kan",
  "vil",
  "jeg",
  "du",
  "vi",
  "man",
  "har",
  "have",
  "mere",
  "hvor",
  "hvordan",
  "hvad",
  "ca",
  "her",
  "ny",
  "samtale",
  "tråd",
  "traad",
])

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "oe")
    .replace(/[å]/g, "aa")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.length >= 3 && !STOPWORDS.has(part))
}

function uniqueTokens(input: string): string[] {
  return Array.from(new Set(tokenize(input)))
}

function looksGenericTitle(input: string): boolean {
  const s = normalizeText(input)
  return !s || s === "ny samtale" || s === "parentesespor"
}

function candidateContext(candidate: Pick<ThreadSummary, "title" | "summary_short" | "preview">): string {
  return [candidate.title, candidate.summary_short, candidate.preview].filter(Boolean).join(" ")
}

function hasMeaningfulCandidateSignal(candidate: Pick<ThreadSummary, "title" | "summary_short" | "preview">): boolean {
  if (candidate.summary_short.trim().length >= 24) return true
  if (candidate.preview.trim().length >= 24) return true
  if (!looksGenericTitle(candidate.title) && candidate.title.trim().length >= 12) return true
  return false
}

function lexicalScore(problem: ScanThreadsPayload["problem"], candidate: Pick<ThreadSummary, "title" | "summary_short" | "preview">): number {
  const problemText = [problem.problem_title, problem.problem_description, ...(problem.topic_tags ?? [])].join(" ")
  const problemTokens = uniqueTokens(problemText)
  if (problemTokens.length === 0) return 0

  const candidateTokens = new Set(uniqueTokens(candidateContext(candidate)))
  if (candidateTokens.size === 0) return 0

  let score = 0
  for (const token of problemTokens) {
    if (candidateTokens.has(token)) score += token.length >= 7 ? 2 : 1
  }
  return score
}

function pickDeterministicCandidates(params: {
  problem: ScanThreadsPayload["problem"]
  candidates: ThreadSummary[]
  maxPick: number
}): string[] {
  const ranked = params.candidates
    .map((candidate) => ({
      candidate,
      score: lexicalScore(params.problem, candidate),
    }))
    .filter((entry) => entry.score >= 2)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.candidate.updated_at < b.candidate.updated_at ? 1 : -1
    })

  return ranked.slice(0, params.maxPick).map((entry) => entry.candidate.conversation_id)
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
        const convId = t.conversation_id
    if (!convId || convId === params.activeConversationId) continue
    const { episode } = await ensureThreadThemeAndEpisode({
      userKey: params.userKey,
      conversationId: convId,
      ttlSeconds: params.ttlSeconds,
    })
    const candidate = {
      conversation_id: convId,
      title: t.title,
      preview: typeof t.preview === "string" ? t.preview : "",
      updated_at: t.updated_at,
      summary_short: asString(episode.summary_short),
    }
    if (!hasMeaningfulCandidateSignal(candidate)) continue
    out.push(candidate)
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
      const p = c.preview ? safeLines(c.preview, 3) : "(no preview yet)"
      const score = typeof c.lexical_score === "number" ? c.lexical_score : 0
      return `- conversation_id: ${c.conversation_id}\n  title: ${safeLines(c.title, 2)}\n  updated_at: ${c.updated_at}\n  lexical_score: ${score}\n  preview: ${p}\n  summary_short: ${s}`
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
    `Select up to ${params.maxPick} conversation_id values from PREVIOUS conversations only. Exclude the active conversation and prefer threads that reduce repeated questions.`

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

function buildNoMatchDraft(params: { job: JobRecordV1; reason: "auto" | "explicit" }): DraftV1 | null {
  if (params.reason === "auto") return null
  return {
    schema_version: "v1",
    job_id: params.job.job_id,
    conversation_id: params.job.conversation_id,
    kind: "scan_threads",
    summary_draft: "Jeg fandt ikke nogen tydeligt relevante tidligere samtaler at genbruge endnu. Du kan fortsætte her, eller pege mig mod et tidligere forløb, hvis du vil have mig til at lede mere målrettet.",
    evidence: [],
    open_questions: ["Er der en bestemt tidligere tråd eller et bestemt emne, du vil have mig til at lede efter?"],
    created_at: nowMs(),
    based_on_revision: params.job.based_on_revision,
    mode: params.job.mode,
  }
}

export async function tickScanThreads(job: JobRecordV1): Promise<{ job: JobRecordV1; completed: boolean }> {
  const ttlSeconds = jobsTtlSeconds()
  const payload = job.payload as unknown as ScanThreadsPayload
  const scanReason = payload?.scan_reason === "auto" ? "auto" : "explicit"

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
          preview: asString((c as any).preview),
          updated_at: asString((c as any).updated_at),
          summary_short: asString((c as any).summary_short),
        }))
        .filter((c) => !!c.conversation_id && c.conversation_id !== job.conversation_id)
        .map((c) => ({
          ...c,
          lexical_score: lexicalScore(payload.problem, c),
        }))
        .filter((c) => hasMeaningfulCandidateSignal(c) && (c.lexical_score ?? 0) >= 2)

      if (typed.length === 0) {
        const noMatchDraft = buildNoMatchDraft({ job, reason: scanReason })
        let resultRef = job.result_ref
        if (noMatchDraft) resultRef = await writeDraft(noMatchDraft, ttlSeconds)
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

      const deterministic = pickDeterministicCandidates({
        problem: payload.problem,
        candidates: typed,
        maxPick: maxDeepDive,
      })

      let selected: string[] = []
      if (!process.env.OPENAI_API_KEY) {
        selected = deterministic
      } else {
        selected = await llmSelectThreads({ payload, candidates: typed, maxPick: maxDeepDive })
          .then((ids) => ids.filter((id) => id && id !== job.conversation_id))
          .then((ids) => ids.filter((id) => deterministic.includes(id)))
      }

      if (selected.length === 0) {
        const noMatchDraft = buildNoMatchDraft({ job, reason: scanReason })
        let resultRef = job.result_ref
        if (noMatchDraft) resultRef = await writeDraft(noMatchDraft, ttlSeconds)
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

      if (deep.length === 0) {
        const noMatchDraft = buildNoMatchDraft({ job, reason: scanReason })
        let resultRef = job.result_ref
        if (noMatchDraft) resultRef = await writeDraft(noMatchDraft, ttlSeconds)
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
        based_on_revision: job.based_on_revision,
        mode: job.mode,
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
