import { AiCapabilityContext } from "../../types"

export type TranscriptTurn = { role: "user" | "assistant"; content: string }

export const MAX_TRANSCRIPT_TURNS = 30
export const MAX_TRANSCRIPT_CHARS = 6000

export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

export function stripPunctuation(text: string): string {
  return normalize(text).replace(/[.,!?;:()"'\u2019\u201c\u201d\u2018\\/-]/g, " ")
}

export function readTranscriptByKey(context: AiCapabilityContext, key: string): TranscriptTurn[] {
  const raw = context.state.meta[key]?.value
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (item): item is { role: "user" | "assistant"; content: string } =>
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .map((item) => ({ role: item.role, content: item.content.trim() }))
    .filter((item) => item.content)
}

export function readStringMeta(context: AiCapabilityContext, key: string): string | undefined {
  const value = context.state.meta[key]?.value
  if (typeof value !== "string") return undefined
  return value.trim() || undefined
}

export function lastAssistantExcerpt(transcript: TranscriptTurn[]): string | undefined {
  return [...transcript].reverse().find((t) => t.role === "assistant")?.content
}

export function countAssistantTurns(turns: TranscriptTurn[]): number {
  return turns.filter((t) => t.role === "assistant").length
}

export function trimTranscript(turns: TranscriptTurn[]): TranscriptTurn[] {
  const capped = turns.slice(-MAX_TRANSCRIPT_TURNS)
  const result: TranscriptTurn[] = []
  let totalChars = 0

  for (let i = capped.length - 1; i >= 0; i--) {
    const len = capped[i].content.length
    if (totalChars + len > MAX_TRANSCRIPT_CHARS) break
    result.unshift(capped[i])
    totalChars += len
  }

  return result
}

export function appendTranscript(
  previous: TranscriptTurn[],
  userText: string,
  assistantText: string,
): TranscriptTurn[] {
  const next = [...previous]
  if (userText.trim()) next.push({ role: "user", content: userText.trim() })
  if (assistantText.trim()) next.push({ role: "assistant", content: assistantText.trim() })
  return next
}
