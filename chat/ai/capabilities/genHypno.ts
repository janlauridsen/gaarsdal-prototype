import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  last_topic?: string
}

const MAX_TRANSCRIPT_TURNS = 16

const GEN_HYPNO_PROMPT = `Du er en rolig, kompetent hypnoterapeut.
Du svarer i en skandinavisk/dansk tone: respektfuld, ikke-moraliserende, uden overdrivelser.
Du er ikke behandlende, men du hjælper brugeren med at forstå rammer og muligheder.

Du får conversation_transcript og user_input.
Du skal svare med:
{
  "assistant_message": string,
  "last_topic": string (optional)
}

Returner KUN gyldig JSON.`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null
  const msg = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  if (!msg) return null
  const last_topic = typeof raw.last_topic === "string" ? raw.last_topic.trim() : undefined
  return { assistant_message: msg, last_topic }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad vil du gerne vide om hypnoterapi—fx hvordan et forløb foregår, hvad man kan arbejde med, eller hvad hypnose egentlig er?"
  }
  return (
    "Tak for dit spørgsmål. Overordnet set er hypnoterapi en samarbejdsproces, hvor man arbejder med opmærksomhed, forestillingsevne og vaner i et trygt, struktureret forløb. " +
    "Vil du høre mest om hvordan et forløb typisk foregår, hvad hypnose føles som, eller hvad man ofte arbejder med?"
  )
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const payload = {
      model: process.env.GEN_HYPNO_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: transcript,
            user_input: context.userText ?? "",
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)

    const assistant = parsed?.assistant_message ?? buildFallbackMessage(context.userText ?? "")
    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", assistant)

    const meta_delta: Record<string, unknown> = {
      "gen_hypno.transcript": updatedTranscript,
    }
    if (parsed?.last_topic) {
      meta_delta["gen_hypno.last_topic"] = parsed.last_topic
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
