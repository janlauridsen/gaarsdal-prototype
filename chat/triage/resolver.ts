import { ConversationState, Transition } from "../kernel/types"

type TriageOutcome =
  | "TRIAGE_FIT_BOOKING"
  | "TRIAGE_NOT_RELEVANT"
  | "TRIAGE_NEEDS_ASSESSMENT"

type LlmDecision = {
  continue_questions: boolean
  follow_up_question?: string
  outcome?: TriageOutcome
  summary?: string
  unclear_points?: string
}

type TriageResolution = {
  transition: Transition
}

const TRIAGE_PROMPT = `Du er en klinisk forsigtig triage-assistent for hypnoterapi.
Du skal returnere KUN gyldig JSON med felterne:
{
  "continue_questions": boolean,
  "follow_up_question": string,
  "outcome": "TRIAGE_FIT_BOOKING" | "TRIAGE_NOT_RELEVANT" | "TRIAGE_NEEDS_ASSESSMENT",
  "summary": string,
  "unclear_points": string
}

Regler:
1) Stil 3-6 korte opklarende spørgsmål i alt.
2) Hvis spørgsmålsantal er under 3, så continue_questions=true.
3) Hvis situationen er uklar eller muligvis risikofyldt, vælg TRIAGE_NEEDS_ASSESSMENT.
4) Ved tydelig match til hypnoterapi, vælg TRIAGE_FIT_BOOKING.
5) Ved tydelig ikke-match, vælg TRIAGE_NOT_RELEVANT.
6) Vær kortfattet og neutral.
7) Ingen markdown, ingen forklaring udenfor JSON.`

function countFromState(state: ConversationState): number {
  const raw = state.meta["triage.question_count"]?.value
  return typeof raw === "number" ? raw : 0
}

function hasAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase()
  return words.some((w) => lower.includes(w))
}

function inferOutcomeHeuristic(text: string): TriageOutcome {
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

function normalizeOutcome(value: unknown): TriageOutcome | undefined {
  if (value === "TRIAGE_FIT_BOOKING") return value
  if (value === "TRIAGE_NOT_RELEVANT") return value
  if (value === "TRIAGE_NEEDS_ASSESSMENT") return value
  return undefined
}

async function decideWithLlm(
  state: ConversationState,
  text: string,
  nextCount: number
): Promise<LlmDecision | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const model = process.env.TRIAGE_LLM_MODEL ?? "gpt-4o-mini"
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"

  const payload = {
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TRIAGE_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          current_node: state.active_node,
          question_count_before: nextCount - 1,
          question_count_after: nextCount,
          latest_user_message: text,
          prior_summary:
            typeof state.meta["triage.summary"]?.value === "string"
              ? state.meta["triage.summary"]?.value
              : "",
        }),
      },
    ],
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== "string") return null

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(content)
  } catch {
    return null
  }

  const continueQuestions = Boolean(parsed.continue_questions)
  const followUpQuestion =
    typeof parsed.follow_up_question === "string"
      ? parsed.follow_up_question.trim()
      : undefined
  const outcome = normalizeOutcome(parsed.outcome)
  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : undefined
  const unclearPoints =
    typeof parsed.unclear_points === "string"
      ? parsed.unclear_points.trim()
      : undefined

  return {
    continue_questions: continueQuestions,
    follow_up_question: followUpQuestion,
    outcome,
    summary,
    unclear_points: unclearPoints,
  }
}

function buildHeuristicDecision(nextCount: number, text: string): LlmDecision {
  if (nextCount < 3) {
    return {
      continue_questions: true,
      follow_up_question: buildQuestion(nextCount),
      unclear_points: "Indledende afklaring i gang",
    }
  }

  if (nextCount < 6) {
    const outcome = inferOutcomeHeuristic(text)
    if (outcome === "TRIAGE_NEEDS_ASSESSMENT") {
      return {
        continue_questions: true,
        follow_up_question: buildQuestion(nextCount),
        unclear_points: "Behov for yderligere afklaring",
      }
    }

    return {
      continue_questions: false,
      outcome,
      summary: `Foreløbig opsummering efter ${nextCount} spørgsmål`,
      unclear_points: "Ingen kritiske uklarheder",
    }
  }

  return {
    continue_questions: false,
    outcome: "TRIAGE_NEEDS_ASSESSMENT",
    summary: "Maks antal spørgsmål nået",
    unclear_points: "Kræver individuel afklaring",
  }
}

export async function resolveTriageFreeText(
  state: ConversationState,
  text: string
): Promise<TriageResolution> {
  const previousCount = countFromState(state)
  const nextCount = Math.min(previousCount + 1, 6)

  const llmDecision = await decideWithLlm(state, text, nextCount)
  const decision = llmDecision ?? buildHeuristicDecision(nextCount, text)

  const shouldContinue = decision.continue_questions && nextCount < 6

  if (shouldContinue) {
    return {
      transition: {
        type: "NODE_HOP",
        from: state.active_node,
        to: "TRIAGE",
        reason: llmDecision
          ? "triage follow-up question from llm"
          : "triage continue questions heuristic fallback",
        response_message:
          decision.follow_up_question?.trim() || buildQuestion(nextCount),
        meta_delta: {
          "triage.question_count": nextCount,
          "triage.unclear_points":
            decision.unclear_points ?? "Behov for yderligere afklaring",
        },
      },
    }
  }

  const resolvedOutcome =
    decision.outcome ??
    inferOutcomeHeuristic(text) ??
    "TRIAGE_NEEDS_ASSESSMENT"

  return {
    transition: {
      type: "NODE_HOP",
      from: state.active_node,
      to: resolvedOutcome,
      reason: llmDecision
        ? "triage outcome resolved by llm"
        : "triage outcome resolved by heuristic fallback",
      response_message:
        decision.summary ||
        "Opsummering: Tak for dine svar. Jeg har lavet en foreløbig vurdering.",
      meta_delta: {
        "triage.question_count": nextCount,
        "triage.summary":
          decision.summary || `Foreløbig opsummering efter ${nextCount} spørgsmål`,
        "triage.outcome": resolvedOutcome,
        "triage.unclear_points":
          decision.unclear_points ||
          (resolvedOutcome === "TRIAGE_NEEDS_ASSESSMENT"
            ? "Behov for afklaringssamtale"
            : "Ingen kritiske uklarheder"),
      },
    },
  }
}
