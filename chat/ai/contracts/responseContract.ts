import { PromptMode } from "./turnAnalysis"

export type FinalResponse = {
  acknowledgement?: string | null
  core_answer: string
  next_step?: string | null
  assistant_message: string
  topic?: string | null
  objective?: string | null
  mode_used: PromptMode
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function joinMessageParts(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join("\n\n")
    .trim()
}

export function normalizeFinalResponse(raw: Record<string, unknown> | null): FinalResponse | null {
  if (!raw) return null

  const acknowledgement = normalizeOptionalString(raw.acknowledgement)
  const core_answer = normalizeOptionalString(raw.core_answer)
  const next_step = normalizeOptionalString(raw.next_step)
  const fallbackAssistant = normalizeOptionalString(raw.assistant_message)
  const topic = normalizeOptionalString(raw.topic)
  const objective = normalizeOptionalString(raw.objective)
  const mode_used = typeof raw.mode_used === "string" ? raw.mode_used : "info"

  if (![
    "info",
    "evidence",
    "practical",
    "reflection",
    "closing",
  ].includes(mode_used)) {
    return null
  }

  const assistant_message = joinMessageParts([
    acknowledgement,
    core_answer,
    next_step,
    fallbackAssistant,
  ])

  if (!assistant_message) return null

  return {
    acknowledgement,
    core_answer: core_answer ?? fallbackAssistant ?? assistant_message,
    next_step,
    assistant_message,
    topic,
    objective,
    mode_used: mode_used as PromptMode,
  }
}
