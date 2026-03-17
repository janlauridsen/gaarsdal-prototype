import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
}

type TranscriptTurn = { role: "user" | "assistant"; content: string }

function isPracticalKeyword(text: string): boolean {
  const t = text.toLowerCase()
  return ["kontakt", "booking", "booke", "telefon", "mail", "pris", "adresse"].some((x) => t.includes(x))
}

function isClosingText(text: string): boolean {
  const t = text.trim().toLowerCase()
  return ["tak", "ok tak", "okay tak", "mange tak", "fint", "super"].includes(t)
}

function containsQuestion(text: string): boolean {
  return text.includes("?")
}

function previousAssistantEndedWithQuestion(transcript: TranscriptTurn[]): boolean {
  const lastAssistant = [...transcript].reverse().find((turn) => turn.role === "assistant")
  if (!lastAssistant) return false
  return containsQuestion(lastAssistant.content)
}

function hadRecentAssistantQuestion(transcript: TranscriptTurn[]): boolean {
  const lastTwoAssistantTurns = transcript.filter((turn) => turn.role === "assistant").slice(-2)
  return lastTwoAssistantTurns.some((turn) => containsQuestion(turn.content))
}

export function applyPolicy(params: {
  userText: string
  analysis: TurnAnalysis
  transcript: TranscriptTurn[]
}): PolicyDecision {
  const { userText, analysis, transcript } = params
  const lastEndedWithQuestion = previousAssistantEndedWithQuestion(transcript)
  const recentQuestion = hadRecentAssistantQuestion(transcript)

  if (isClosingText(userText) || analysis.proposed_mode === "closing" || analysis.conversation_move === "close") {
    return {
      allow_mode: "closing",
      allow_question: false,
      max_questions: 0,
      response_length: "short",
      require_redirect: "none",
    }
  }

  if (
    isPracticalKeyword(userText) ||
    analysis.intent === "seek_practical_help" ||
    (analysis.conversation_move === "practical_preparation" && analysis.proposed_mode === "practical")
  ) {
    return {
      allow_mode: "practical",
      allow_question: false,
      max_questions: 0,
      response_length: analysis.relational_state === "decision_support" ? "medium" : "short",
      require_redirect: analysis.response_goal === "route_to_contact" ? "contact" : "none",
    }
  }

  if (analysis.proposed_mode === "evidence") {
    return {
      allow_mode: "evidence",
      allow_question: false,
      max_questions: 0,
      response_length: "medium",
      require_redirect: "none",
    }
  }

  if (analysis.proposed_mode === "reflection") {
    const allowQuestion =
      analysis.response_goal === "answer_then_one_question" &&
      !lastEndedWithQuestion &&
      !recentQuestion &&
      ["guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge"].includes(analysis.conversation_move)

    return {
      allow_mode: "reflection",
      allow_question: allowQuestion,
      max_questions: allowQuestion ? 1 : 0,
      response_length: "medium",
      require_redirect: "none",
    }
  }

  const allowQuestion =
    analysis.response_goal === "clarify_minimally" &&
    !lastEndedWithQuestion &&
    !recentQuestion

  return {
    allow_mode: analysis.proposed_mode,
    allow_question: allowQuestion,
    max_questions: allowQuestion ? 1 : 0,
    response_length: analysis.response_goal === "close_briefly" ? "short" : "medium",
    require_redirect: "none",
  }
}
