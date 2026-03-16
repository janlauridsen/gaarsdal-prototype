import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
}

function isPracticalKeyword(text: string): boolean {
  const t = text.toLowerCase()
  return ["kontakt", "booking", "booke", "telefon", "mail", "pris", "adresse"].some((x) => t.includes(x))
}

function isClosingText(text: string): boolean {
  const t = text.trim().toLowerCase()
  return ["tak", "ok tak", "okay tak", "mange tak", "fint", "super"].includes(t)
}

export function applyPolicy(params: {
  userText: string
  analysis: TurnAnalysis
}): PolicyDecision {
  const { userText, analysis } = params

  if (isClosingText(userText) || analysis.proposed_mode === "closing") {
    return {
      allow_mode: "closing",
      allow_question: false,
      max_questions: 0,
      response_length: "short",
      require_redirect: "none",
    }
  }

  if (isPracticalKeyword(userText) || analysis.intent === "seek_practical_help") {
    return {
      allow_mode: "practical",
      allow_question: false,
      max_questions: 0,
      response_length: analysis.relational_state === "decision_support" ? "medium" : "short",
      require_redirect: analysis.response_goal === "route_to_contact" ? "contact" : "none",
    }
  }

  if (analysis.proposed_mode === "reflection" && analysis.confidence < 0.55) {
    return {
      allow_mode: "info",
      allow_question: true,
      max_questions: 1,
      response_length: "medium",
      require_redirect: "none",
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
    return {
      allow_mode: "reflection",
      allow_question: true,
      max_questions: 1,
      response_length: "medium",
      require_redirect: "none",
    }
  }

  return {
    allow_mode: analysis.proposed_mode,
    allow_question: analysis.response_goal !== "answer_directly",
    max_questions: analysis.response_goal === "answer_then_one_question" ? 1 : 0,
    response_length:
      analysis.response_goal === "close_briefly"
        ? "short"
        : analysis.relational_state === "building_trust"
          ? "medium"
          : "medium",
    require_redirect: "none",
  }
}
