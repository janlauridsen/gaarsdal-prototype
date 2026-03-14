import { LlmClient } from "../types"
import { normalizeTurnAnalysis, TurnAnalysis } from "../contracts/turnAnalysis"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const ANALYSIS_PROMPT = `Analyser brugerens seneste besked i konteksten af en samtale om hypnoterapi, vaneændring, mønsterforståelse og praktisk hjælp.

Din opgave er ikke at svare brugeren.
Din opgave er kun at vælge den bedste håndtering af denne turn.

Vælg:
- intent
- proposed_mode
- response_goal
- topic hvis tydeligt
- objective hvis tydeligt
- sensitivity
- signals
- confidence

Regler:
- vælg reflection kun hvis brugeren tydeligt undersøger egne mønstre, vaner, reaktioner eller indre processer
- vælg evidence kun hvis brugeren tydeligt spørger til effekt, dokumentation eller om det virker
- vælg practical kun ved praktiske eller administrative behov
- vælg closing ved korte sociale lukninger
- vælg info som default ved forklaring, relevans eller forståelse
- vælg unclear hvis intentionen er for svag eller blandet

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
            sensitivity: ["low", "medium", "high"],
            confidence_range: [0, 1],
          },
        }),
      },
    ],
  })

  return normalizeTurnAnalysis(result)
}
