import { normalizeTurnAnalysis, TurnAnalysis } from "../contracts/turnAnalysis"
import { LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

// Compact analysis prompt - down from ~2500 chars to ~1200 chars
// Key insight: LLM only classifies, applyPolicy makes decisions - so prompt can be shorter
const ANALYSIS_PROMPT = `Du analyserer brugerens seneste besked i en hypnoterapi-chatbot. Formålet er information, let refleksion og forberedelse - ikke behandling.

Returner KUN gyldig JSON med disse felter:

intent: "understand_method" | "ask_evidence" | "seek_practical_help" | "explore_pattern" | "social_closing" | "unclear"
proposed_mode: "info" | "evidence" | "practical" | "reflection" | "closing"
conversation_move: "direct_answer" | "guided_observation" | "pattern_detection" | "metacognitive_probe" | "mild_challenge" | "practical_preparation" | "synthesis" | "close"
investigation_focus: "attention" | "interpretation" | "regulation" | "pattern" | "preparation" | "none"
response_goal: "answer_directly" | "answer_then_one_question" | "clarify_minimally" | "close_briefly" | "route_to_contact"
relational_state: "orienting" | "building_clarity" | "building_trust" | "decision_support" | "gentle_close"
routing_intent: "contact_booking" | "booking_info" | "lead_capture" | "fit_check" | "none"
is_history_query: boolean  // true hvis brugeren spørger hvad du ved/husker om dem
topic: string | null
objective: string | null
sensitivity: "low" | "medium" | "high"
signals: string[]
confidence: number (0-1)

routing_intent-regler (vurder i kontekst — ikke kun nøgleord):
- contact_booking: brugeren vil aktivt booke eller kontakte Jan nu — og har ALLEREDE fået svar på praktiske spørgsmål. Kræver eksplicit handlingsord: "jeg vil gerne booke", "kan jeg få en tid", "how do I sign up". IKKE ved spørgsmål om pris, antal sessioner, varighed, hvad det indebærer — selv hvis booking nævnes i samme sætning som et spørgsmål. Eksempel der er none: "skal jeg i behandling mange gange og er det dyrt", "hvad koster det", "hvor mange gange skal man komme", "inden jeg booker — hvad sker der i en session".
- booking_info: brugeren søger praktisk information om pris, antal sessioner, varighed, hvad der sker i en session, adresse, åbningstider, eller hvordan man kontakter Jan — men er ikke klar til at handle endnu. Eksempler: "hvad koster det", "hvor mange gange skal jeg komme", "hvad sker der i en session", "hvor ligger klinikken", "kan man ringe til Jan", "hvad indebærer det".
- lead_capture: brugeren er interesseret men eksplicit ikke klar. Eksempler: "ikke nu", "tænker over det", "vil gerne have mere info først", "send mig noget".
- fit_check: brugeren vil vide om hypnoterapi passer til netop dem. Eksempler: "er det noget for mig", "virker det for min type problem", "passer det til min situation".
- none: alt andet — spørgsmål om hypnoterapi som metode, refleksion, mønstre, adfærd, og alle spørgsmål der søger forståelse frem for praktisk info eller handling.

Prioriteter:
- Personlig friktion/barriere/uro → reflection, ikke info
- Kontakt/booking/pris/adresse → practical
- Evidens/virker/forskning → evidence
- Afslutning (tak, ok) → closing
- Reflection må starte proaktivt hvis brugeren tydeligt beskriver eget mønster
- Practical vælges IKKE bare fordi brugeren skriver "kan du hjælpe"`

export async function analyzeTurn(params: {
  llm: LlmClient
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
  lastMove?: string
  lastAssistantExcerpt?: string
}): Promise<TurnAnalysis | null> {
  const result = await params.llm.chatJson({
    model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          transcript: params.transcript.slice(-6), // Only last 6 turns needed for classification
          user_input: params.userText,
          last_topic: params.lastTopic ?? "",
          last_move: params.lastMove ?? "",
          last_assistant_excerpt: params.lastAssistantExcerpt
            ? params.lastAssistantExcerpt.slice(0, 120)
            : "",
        }),
      },
    ],
  })

  if (!result) return null
  return normalizeTurnAnalysis(result)
}
