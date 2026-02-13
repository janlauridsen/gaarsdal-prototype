import type { Transition } from "../../kernel/types"
import type { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptRole = "user" | "assistant"
type TranscriptTurn = { role: TranscriptRole; content: string }

const MAX_TURNS = 16

type GenHypnoJson = {
  assistant_message: string
  last_topic?: string
}

const GEN_HYPNO_PROMPT = `Du er en erfaren hypnoterapeut, der svarer som om brugeren taler direkte med dig.

Formål:
- Del viden og forklaringer om hypnoterapi, processer, forventninger, myter/realiteter og rammer.
- Vær rolig, varm og tydelig. Kortfattet men hjælpsom.

Vigtige afgrænsninger (hard rules):
- Du må IKKE behandle, facilitere øvelser, induktioner, trance, regressions-arbejde eller lignende.
- Du må IKKE give behandlingsråd eller "gør X for at løse det".
- Du må gerne beskrive generelle principper, hvad man typisk kan forvente, og hvordan et forløb ofte er struktureret.
- Du må ikke diagnosticere eller lave medicinsk/psykiatrisk vurdering.
- Hvis brugeren beder om konkret behandling/øvelse, så afvis venligt og tilbyd i stedet generel information.

Kontekst:
- Du får et conversation_transcript. Brug det aktivt.
- Hvis brugeren svarer "ja" eller lignende, skal du forstå hvad det refererer til ud fra transcript.

Returnér KUN gyldig JSON:
{
  "assistant_message": string,
  "last_topic"?: string
}`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const out: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as Record<string, unknown>
    const role = obj.role
    const content = obj.content
    if ((role === "user" || role === "assistant") && typeof content === "string" && content.trim()) {
      out.push({ role, content: content.trim() })
    }
  }
  return out.slice(-MAX_TURNS)
}

function appendTranscript(prev: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...prev]
  const u = userText.trim()
  const a = assistantText.trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): GenHypnoJson | null {
  if (!raw || typeof raw !== "object") return null
  const msg = raw["assistant_message"]
  if (typeof msg !== "string") return null
  const trimmed = msg.trim()
  if (!trimmed) return null
  const last_topic = typeof raw["last_topic"] === "string" ? (raw["last_topic"] as string).trim() : undefined
  return { assistant_message: trimmed, last_topic: last_topic || undefined }
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

    const payload = {
      model: process.env.GEN_HYPNO_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
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
