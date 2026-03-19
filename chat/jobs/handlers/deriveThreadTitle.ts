import { createOpenAiCompatibleClient } from "../../ai/provider"
import { readThreadIndex, writeThreadIndex, maybePromoteThreadTitle, isGenericThreadTitle } from "../../persistence/threadIndexStore"
import { readRawTurns } from "../../raw/store"
import { jobsTtlSeconds } from "../store"
import { DeriveThreadTitlePayload, JobRecordV1 } from "../types"

function nowMs(): number {
  return Date.now()
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function sanitizeTitle(input: string): string {
  const clean = asString(input).replace(/\s+/g, " ").trim()
  if (!clean) return ""
  const words = clean.split(" ").filter(Boolean).slice(0, 6)
  const joined = words.join(" ").trim()
  if (!joined) return ""
  return joined.length <= 60 ? joined : `${joined.slice(0, 60).trim()}…`
}

function collectTranscript(turns: Awaited<ReturnType<typeof readRawTurns>>): string {
  return turns
    .slice(0, 6)
    .map((turn) => {
      const user = asString(turn.user_input).trim()
      const assistant = asString(turn.assistant_output).trim()
      return [user ? `U: ${user}` : "", assistant ? `A: ${assistant}` : ""].filter(Boolean).join("\n")
    })
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 4000)
}

async function deriveCandidate(params: {
  currentTitle: string
  transcript: string
}): Promise<{ title: string; confidence: number } | null> {
  const llm = createOpenAiCompatibleClient()
  const json = await llm.chatJson({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Create a short Danish thread title for a conversation. " +
          "Ignore names, greetings, politeness, mood statements, and corrections. " +
          "Focus on the user's main problem or topic. " +
          "If no stable topic exists yet, return title 'Ny samtale' with low confidence. " +
          "Return strict JSON: { title: string, confidence: number }.",
      },
      {
        role: "user",
        content:
          `Current title: ${params.currentTitle || "Ny samtale"}\n\n` +
          `Transcript:\n${params.transcript}\n\n` +
          "Rules: max 6 words, no quotes, no punctuation-heavy labels, no names unless essential.",
      },
    ],
  })

  if (!json) return null
  const title = sanitizeTitle(asString((json as any).title))
  const confidenceRaw = typeof (json as any).confidence === "number" ? (json as any).confidence : 0
  return { title, confidence: clamp(confidenceRaw, 0, 1) }
}

export async function tickDeriveThreadTitle(job: JobRecordV1): Promise<{ job: JobRecordV1; completed: boolean }> {
  const ttlSeconds = jobsTtlSeconds()
  const payload = (job.payload ?? {}) as DeriveThreadTitlePayload
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
        cursor: "GENERATE",
        progress: 0.1,
        work: {},
      }
      return { job: next, completed: false }
    }

    if (job.status !== "running") {
      return { job: updatedBase, completed: true }
    }

    const index = await readThreadIndex(job.user_key)
    const thread = index?.threads.find((t) => t.conversation_id === job.conversation_id)
    if (!index || !thread) {
      const next: JobRecordV1 = { ...updatedBase, status: "completed", cursor: "DONE", progress: 1 }
      return { job: next, completed: true }
    }

    const currentConfidence = typeof thread.title_confidence === "number" ? thread.title_confidence : 0
    const currentBasisRevision = typeof thread.title_basis_revision === "number" ? thread.title_basis_revision : 0
    const currentGeneric = isGenericThreadTitle(thread.title)
    const triggerTurn = typeof payload.trigger_turn === "number" ? payload.trigger_turn : job.based_on_revision
    const earlyWindow = triggerTurn <= 3
    const frozen = currentConfidence >= 0.8 || currentBasisRevision >= 4

    if (!currentGeneric && (!earlyWindow || frozen)) {
      const next: JobRecordV1 = { ...updatedBase, status: "completed", cursor: "DONE", progress: 1 }
      return { job: next, completed: true }
    }

    const turns = await readRawTurns({ conversationId: job.conversation_id, limit: 8 })
    const transcript = collectTranscript(turns)
    if (!transcript.trim()) {
      const next: JobRecordV1 = { ...updatedBase, status: "completed", cursor: "DONE", progress: 1 }
      return { job: next, completed: true }
    }

    let candidate: { title: string; confidence: number } | null = null
    if (process.env.OPENAI_API_KEY) {
      candidate = await deriveCandidate({ currentTitle: thread.title, transcript })
    }

    const safeTitle = sanitizeTitle(candidate?.title ?? "")
    const safeConfidence = clamp(candidate?.confidence ?? 0, 0, 1)

    if (safeTitle && !isGenericThreadTitle(safeTitle) && safeConfidence > 0) {
      const nextIndex = maybePromoteThreadTitle({
        index,
        conversationId: job.conversation_id,
        title: safeTitle,
        confidence: safeConfidence,
        basisRevision: Math.max(0, job.based_on_revision),
      })
      if (JSON.stringify(nextIndex) !== JSON.stringify(index)) {
        await writeThreadIndex({ userKey: job.user_key, index: nextIndex, ttlSeconds })
      }
    }

    const next: JobRecordV1 = {
      ...updatedBase,
      status: "completed",
      cursor: "DONE",
      progress: 1,
      work: {
        trigger_turn: triggerTurn,
      },
    }
    return { job: next, completed: true }
  } catch (err: any) {
    const failed: JobRecordV1 = {
      ...updatedBase,
      status: "failed",
      cursor: "FAILED",
      progress: 1,
      last_error: err?.message ? String(err.message) : "derive_thread_title_failed",
    }
    return { job: failed, completed: true }
  }
}
