import type { Transition } from "../../kernel/types"
import type { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type GenHypnoJson = {
  assistant_message: string
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
- Hvis brugeren spørger efter konkret behandling/øvelse, så afvis venligt og tilbyd i stedet generel information.

Samtaleregel:
- Start altid med en kort anerkendelse/spejling af det brugeren spørger om.
- Stil gerne ét afklarende spørgsmål, men kun hvis det giver mening for at kunne give bedre generel information.
- Ingen tekniske systemforklaringer.

Returnér KUN gyldig JSON:
{
  "assistant_message": string
}`

function normalizeOutput(raw: Record<string, unknown> | null): GenHypnoJson | null {
  if (!raw || typeof raw !== "object") return null
  const msg = raw["assistant_message"]
  if (typeof msg !== "string") return null
  const trimmed = msg.trim()
  if (!trimmed) return null
  return { assistant_message: trimmed }
}

function buildFallbackMessage(userText: string): string {
  const hasText = userText.trim().length > 0
  if (!hasText) {
    return "Hvad vil du gerne vide om hypnoterapi—fx hvordan et forløb foregår, hvad man kan arbejde med, eller hvad hypnose egentlig er?"
  }
  return (
    "Tak for dit spørgsmål. Overordnet set er hypnoterapi en samarbejdsproces, hvor man arbejder med opmærksomhed, forestillingsevne og vaner i et trygt, struktureret forløb. " +
    "Hvad er du mest nysgerrig på—hvordan et forløb foregår, hvad hypnose føles som, eller hvilke temaer man typisk arbejder med?"
  )
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const payload = {
      model: process.env.GEN_HYPNO_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        { role: "user" as const, content: context.userText ?? "" },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)
    const message = parsed?.assistant_message ?? buildFallbackMessage(context.userText ?? "")

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "gen-hypno-free-text",
      response_message: message,
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
