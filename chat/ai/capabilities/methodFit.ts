import type { Transition } from "../../kernel/types"
import type { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptRole = "user" | "assistant"
type TranscriptTurn = { role: TranscriptRole; content: string }

const MAX_TURNS = 16

type MethodFitJson = {
  assistant_message: string
  summary?: string
}

const METHOD_FIT_PROMPT = `Du hjælper brugeren med at vælge retning: hypnoterapi eller typiske alternativer.

Formål:
- Afklare match mellem brugerens mål/situation og hypnoterapi som tilgang.
- Hvis hypnoterapi typisk ikke matcher, nævn 1-3 alternative retninger i generelle termer (fx samtaleterapi, coaching, mindfulness/stress-tilgange, lægefaglig afklaring).
- Du må gerne forklare forskelle på tilgange på et overordnet plan.

Hard rules:
- Ingen behandling, øvelser, induktioner eller konkrete behandlingsråd.
- Ingen diagnosticering eller medicinsk/psykiatrisk vurdering.
- Stil maks. 1 afklarende spørgsmål pr svar, og kun hvis nødvendigt.
- Vær tydelig om at du giver overblik, ikke behandling.

Du får conversation_transcript og user_input. Brug transcript aktivt.

Returnér KUN gyldig JSON:
{
  "assistant_message": string,
  "summary"?: string
}`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["method_fit.transcript"]?.value
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

function normalizeOutput(raw: Record<string, unknown> | null): MethodFitJson | null {
  if (!raw || typeof raw !== "object") return null
  const msg = raw["assistant_message"]
  if (typeof msg !== "string") return null
  const assistant_message = msg.trim()
  if (!assistant_message) return null
  const summary = typeof raw["summary"] === "string" ? (raw["summary"] as string).trim() : undefined
  return { assistant_message, summary: summary || undefined }
}

function buildFallback(userText: string): MethodFitJson {
  const hasText = userText.trim().length > 0
  return {
    assistant_message: hasText
      ? "Tak. For at vurdere retning på et overordnet plan: hvad vil du gerne opnå, og hvad har du allerede prøvet? (Jeg giver kun overblik, ikke behandling.)"
      : "Hvad vil du gerne opnå—og handler det mest om fx vaner, angst/uro, selvværd, stress, smerter eller motivation? (Jeg giver kun overblik, ikke behandling.)",
    summary: "",
  }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)

    const payload = {
      model: process.env.METHOD_FIT_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: METHOD_FIT_PROMPT },
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
    const parsed = normalizeOutput(response) ?? buildFallback(context.userText ?? "")

    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", parsed.assistant_message)

    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
    }
    if (parsed.summary) meta_delta["method_fit.summary"] = parsed.summary

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-free-text",
      response_message: parsed.assistant_message,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "method-fit-v1",
        used_fallback: !response,
      },
    }
  },
}
