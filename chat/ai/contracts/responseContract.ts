import { PromptMode } from "./turnAnalysis"

export type FinalResponse = {
  assistant_message: string
  topic?: string | null
  objective?: string | null
  mode_used: PromptMode
}

export function normalizeFinalResponse(raw: Record<string, unknown> | null): FinalResponse | null {
  if (!raw) return null

  const assistant_message = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  const topic = typeof raw.topic === "string" && raw.topic.trim() ? raw.topic.trim() : null
  const objective = typeof raw.objective === "string" && raw.objective.trim() ? raw.objective.trim() : null
  const mode_used = typeof raw.mode_used === "string" ? raw.mode_used : "info"

  if (!assistant_message) return null
  if (!["info", "evidence", "practical", "reflection", "closing"].includes(mode_used)) return null

  return {
    assistant_message,
    topic,
    objective,
    mode_used: mode_used as PromptMode,
  }
}
