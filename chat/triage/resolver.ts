import { ConversationState, Transition } from "../kernel/types"

const TRIAGE_PROMPT = `Du er en klinisk forsigtig triage-assistent for hypnoterapi.
Mål:
1) Afklar om brugerens problem kan være relevant for hypnoterapi.
2) Stil 3-6 korte opklarende spørgsmål.
3) Hvis nok klarhed: giv kort opsummering + outcome.
4) Hvis uklarhed efter 6 spørgsmål: foreslå afklaringssamtale.
Outcomes:
- TRIAGE_FIT_BOOKING
- TRIAGE_NOT_RELEVANT
- TRIAGE_NEEDS_ASSESSMENT`

type TriageResolution = {
  transition: Transition
}

function countFromState(state: ConversationState): number {
  const raw = state.meta["triage.question_count"]?.value
  return typeof raw === "number" ? raw : 0
}

function hasAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase()
  return words.some((w) => lower.includes(w))
}

function inferOutcome(text: string):
  | "TRIAGE_FIT_BOOKING"
  | "TRIAGE_NOT_RELEVANT"
  | "TRIAGE_NEEDS_ASSESSMENT" {
  const acute = hasAny(text, ["selvmord", "psykose", "akut", "farlig"])
  if (acute) return "TRIAGE_NEEDS_ASSESSMENT"

  const likelyFit = hasAny(text, [
    "stress",
    "uro",
    "angst",
    "søvn",
    "vane",
    "rygestop",
    "selvtillid",
    "fobi",
  ])
  if (likelyFit) return "TRIAGE_FIT_BOOKING"

  const likelyNotFit = hasAny(text, [
    "juridisk",
    "skilsmissepapirer",
    "økonomi",
    "skadeanmeldelse",
    "it-problem",
  ])
  if (likelyNotFit) return "TRIAGE_NOT_RELEVANT"

  return "TRIAGE_NEEDS_ASSESSMENT"
}

function buildQuestion(step: number): string {
  const questions = [
    "Hvornår begyndte problemet, og hvor ofte mærker du det?",
    "Hvordan påvirker det din hverdag lige nu?",
    "Hvad har du allerede prøvet for at få det bedre?",
    "Er der triggere eller bestemte situationer, som forværrer det?",
    "Hvad håber du konkret at opnå med et forløb?",
    "Er der noget vigtigt, vi mangler at afklare, før vi vælger næste skridt?",
  ]
  return questions[Math.min(step, questions.length - 1)]
}

export function resolveTriageFreeText(
  state: ConversationState,
  text: string
): TriageResolution {
  void TRIAGE_PROMPT

  const previousCount = countFromState(state)
  const nextCount = previousCount + 1

  if (nextCount < 3) {
    return {
      transition: {
        type: "NODE_HOP",
        from: state.active_node,
        to: "TRIAGE",
        reason: "triage continue questions",
        response_message: buildQuestion(nextCount),
        meta_delta: {
          "triage.question_count": nextCount,
        },
      },
    }
  }

  if (nextCount <= 5) {
    const outcomeGuess = inferOutcome(text)
    const needsMore = outcomeGuess === "TRIAGE_NEEDS_ASSESSMENT" && nextCount < 6

    if (needsMore) {
      return {
        transition: {
          type: "NODE_HOP",
          from: state.active_node,
          to: "TRIAGE",
          reason: "triage clarify before final outcome",
          response_message:
            "Tak. Der er stadig lidt uklarhed. " + buildQuestion(nextCount),
          meta_delta: {
            "triage.question_count": nextCount,
            "triage.unclear_points": "Behov for yderligere afklaring",
          },
        },
      }
    }

    return {
      transition: {
        type: "NODE_HOP",
        from: state.active_node,
        to: outcomeGuess,
        reason: "triage outcome after minimum questions",
        response_message:
          "Opsummering: Tak for dine svar. Jeg har lavet en foreløbig vurdering.",
        meta_delta: {
          "triage.question_count": nextCount,
          "triage.summary": `Foreløbig opsummering efter ${nextCount} spørgsmål`,
          "triage.outcome": outcomeGuess,
          "triage.unclear_points":
            outcomeGuess === "TRIAGE_NEEDS_ASSESSMENT"
              ? "Behov for afklaringssamtale"
              : "Ingen kritiske uklarheder",
        },
      },
    }
  }

  return {
    transition: {
      type: "NODE_HOP",
      from: state.active_node,
      to: "TRIAGE_NEEDS_ASSESSMENT",
      reason: "triage reached max question budget",
      response_message:
        "Opsummering: Vi har nået 6 spørgsmål, og der er fortsat uklarheder. Jeg anbefaler en afklaringssamtale.",
      meta_delta: {
        "triage.question_count": 6,
        "triage.outcome": "TRIAGE_NEEDS_ASSESSMENT",
        "triage.summary": "Maks antal spørgsmål nået",
        "triage.unclear_points": "Kræver individuel afklaring",
      },
    },
  }
}
