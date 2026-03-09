import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmClient,
} from "../types"
import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  last_topic?: string
  problem_title?: string
  problem_summary?: string
  topic_tags?: string[]
}

const MAX_TRANSCRIPT_TURNS = 30
const MAX_TRANSCRIPT_CHARS = 6000

const GEN_HYPNO_PROMPT = `
ROLLE
Du er en rolig, kompetent hypnoterapeut.

SAMTALESTRUKTUR
Du modtager:
- conversation_transcript
- user_input
- assistant_turn_count

OPSUMMERINGSREGEL
- Hvis assistant_turn_count > 0 OG assistant_turn_count % 4 === 0:
  Giv en kort, struktureret opsummering før du går videre.
- Afslut med højst ét konkret spørgsmål.

EVIDENSRAMME
(A) God evidens: Flere systematiske reviews eller metaanalyser.
(B) Moderat/blandet evidens: Mindre RCT'er eller blandede resultater.
(C) Begrænset evidens: Få studier eller metodiske begrænsninger.
(D) Primært klinisk erfaring.
Hvis uklart: skriv "evidens: uklar".

Du behandler ikke, lover ikke noget og kan ikke booke eller lave andre aftaler. 

Hvis brugeren ønsker reflekterende dialog, hjælp til misbrug foreslå ny tråd oprettes.

LAST_TOPIC
- 1–2 ord
- små bogstaver
- generelt og stabilt
- genbrug hvis muligt

PROBLEM_CAPTURE
- Hvis brugerens input beskriver et konkret problem eller tema, udfyld også:
  - "problem_title": 1-4 ord
  - "problem_summary": 1 kort sætning, neutral og præcis
  - "topic_tags": liste med 1-3 korte tags i små bogstaver
- Udelad felterne hvis problemet ikke er konkret nok endnu.

OUTPUT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "last_topic": string (optional),
  "problem_title": string (optional),
  "problem_summary": string (optional),
  "topic_tags": string[] (optional)
}
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
  if (!Array.isArray(raw)) return []

  const turns: TranscriptTurn[] = []

  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any

    if (
      (obj.role === "user" || obj.role === "assistant") &&
      typeof obj.content === "string"
    ) {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }

  return turns
}

function trimTranscript(turns: TranscriptTurn[]): TranscriptTurn[] {
  const cappedByTurn = turns.slice(-MAX_TRANSCRIPT_TURNS)

  const result: TranscriptTurn[] = []
  let totalChars = 0

  for (let i = cappedByTurn.length - 1; i >= 0; i--) {
    const len = cappedByTurn[i].content.length
    if (totalChars + len > MAX_TRANSCRIPT_CHARS) break
    result.unshift(cappedByTurn[i])
    totalChars += len
  }

  return result
}

function appendTranscript(
  previous: TranscriptTurn[],
  userText: string,
  assistantText: string
): TranscriptTurn[] {
  const next = [...previous]

  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()

  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })

  return next
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null

  const msg =
    typeof raw.assistant_message === "string"
      ? raw.assistant_message.trim()
      : ""

  if (!msg) return null

  const last_topic =
    typeof raw.last_topic === "string"
      ? raw.last_topic.trim()
      : undefined

  const problem_title =
    typeof raw.problem_title === "string"
      ? raw.problem_title.trim()
      : undefined

  const problem_summary =
    typeof raw.problem_summary === "string"
      ? raw.problem_summary.trim()
      : undefined

  const topic_tags = Array.isArray(raw.topic_tags)
    ? raw.topic_tags
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : undefined

  return { assistant_message: msg, last_topic, problem_title, problem_summary, topic_tags }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad vil du gerne vide om hypnoterapi?"
  }

  return "Tak for dit spørgsmål. Vil du høre mest om metoder, evidens eller hvordan et forløb typisk foregår?"
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",

  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    const fullTranscript = readTranscript(context)
    const trimmedTranscript = trimTranscript(fullTranscript)

    const previousAssistantCount =
      Number(context.state.meta["gen_hypno.assistant_turn_count"]?.value) || 0

    const payload = {
      model:
        process.env.GEN_HYPNO_MODEL ??
        process.env.TRIAGE_MODEL ??
        "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        { role: "system" as const, content: GAARSDAL_SITE_CONTEXT_DA },
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: trimmedTranscript,
            user_input: context.userText ?? "",
            assistant_turn_count: previousAssistantCount,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)

    const assistant =
      parsed?.assistant_message ??
      buildFallbackMessage(context.userText ?? "")

    const updatedTranscript = appendTranscript(
      fullTranscript,
      context.userText ?? "",
      assistant
    )

    const newAssistantCount = previousAssistantCount + 1

    const meta_delta: Record<string, unknown> = {
      "gen_hypno.transcript": updatedTranscript,
      "gen_hypno.assistant_turn_count": newAssistantCount,
    }

    if (parsed?.last_topic) {
      meta_delta["gen_hypno.last_topic"] = parsed.last_topic
    }
    if (parsed?.problem_title) {
      meta_delta["gen_hypno.problem_title"] = parsed.problem_title
    }
    if (parsed?.problem_summary) {
      meta_delta["gen_hypno.problem_summary"] = parsed.problem_summary
    }
    if (parsed?.topic_tags?.length) {
      meta_delta["gen_hypno.topic_tags"] = parsed.topic_tags
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "gen-hypno-free-text",
      response_message: assistant,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "gen-hypno-v1",
        used_fallback: !parsed,
      },
    }
  },
}
