import { normalizeTurnAnalysis, TurnAnalysis } from "../contracts/turnAnalysis"
import { LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const ANALYSIS_PROMPT = `Analyser brugerens seneste besked i konteksten af en samtale om hypnoterapi, vaneændring, mønsterforståelse og praktisk hjælp.

Din opgave er ikke at svare brugeren.
Din opgave er kun at vælge den bedste håndtering af denne turn.

Vælg:
- intent
- proposed_mode
- response_goal
- relational_state
- topic hvis tydeligt
- objective hvis tydeligt
- sensitivity
- signals
- confidence

Vigtige regler:
- vælg practical kun ved praktiske eller administrative behov som kontakt, booking, pris, adresse, telefon, e-mail eller konkrete næste skridt om at tage kontakt
- vælg IKKE practical bare fordi brugeren skriver "kan du hjælpe"
- hvis brugeren beskriver et problem, en vane, et mønster, alkohol, søvn, stress, uro, tanker eller reaktioner, så er det normalt info eller reflection
- vælg reflection kun hvis brugeren tydeligt undersøger egne mønstre, vaner, reaktioner eller indre processer
- vælg evidence kun hvis brugeren tydeligt spørger til effekt, dokumentation eller om det virker
- vælg closing ved korte sociale lukninger
- vælg info som default ved forklaring, relevans eller forståelse
- vælg unclear hvis intentionen er for svag eller blandet

Relational_state skal beskrive, hvordan svaret bedst lander menneskeligt:
- orienting: brugeren orienterer sig og har brug for roligt overblik
- building_clarity: brugeren har brug for afgrænsning, tydelighed eller en enkel struktur
- building_trust: brugeren virker forsigtig, sårbar eller afsøgende og har brug for nøgtern, tryg landing
- decision_support: brugeren er tættere på valg, næste skridt eller vurdering af relevans
- gentle_close: brugeren lukker samtalen venligt ned

Præcise eksempler:
- "jeg vil gerne tale med Jan" => practical + decision_support
- "hvad koster det?" => practical + decision_support
- "hvor ligger klinikken?" => practical + building_clarity
- "kan du hjælpe med et alkohol problem" => info eller reflection, ikke practical
- "jeg forstår ikke hvorfor jeg reagerer sådan" => reflection + building_trust eller building_clarity
- "virker hypnoterapi mod søvnproblemer?" => evidence eller info afhængigt af formuleringen

Returner kun gyldig JSON efter kontrakten.`

export async function analyzeTurn(params: {
  llm: LlmClient
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
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
          transcript: params.transcript,
          user_input: params.userText,
          last_topic: params.lastTopic ?? "",
          contract: {
            intent: [
              "understand_method",
              "ask_evidence",
              "seek_practical_help",
              "explore_pattern",
              "social_closing",
              "unclear",
            ],
            proposed_mode: ["info", "evidence", "practical", "reflection", "closing"],
            response_goal: [
              "answer_directly",
              "answer_then_one_question",
              "clarify_minimally",
              "close_briefly",
              "route_to_contact",
            ],
            relational_state: [
              "orienting",
              "building_clarity",
              "building_trust",
              "decision_support",
              "gentle_close",
            ],
            sensitivity: ["low", "medium", "high"],
            confidence_range: [0, 1],
          },
        }),
      },
    ],
  })

  return normalizeTurnAnalysis(result)
}
