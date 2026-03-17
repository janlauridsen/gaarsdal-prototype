import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
}

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type ModeScoreMap = Record<PromptMode, number>

function normalized(text: string): string {
  return text.toLowerCase().trim()
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

function isClosingText(text: string): boolean {
  const t = normalized(text)
  return ["tak", "ok tak", "okay tak", "mange tak", "fint", "super"].includes(t)
}

function startsLikeGreeting(text: string): boolean {
  const t = normalized(text)
  return ["hej", "hejsa", "goddag", "halløj", "hallo", "yo"].includes(t)
}

function computeModeScores(userText: string, analysis: TurnAnalysis, transcript: TranscriptTurn[]): ModeScoreMap {
  const t = normalized(userText)
  const scores: ModeScoreMap = {
    info: 0.25,
    evidence: 0,
    practical: 0,
    reflection: 0,
    closing: 0,
  }

  scores[analysis.proposed_mode] += 0.9

  if (analysis.intent === "social_closing" || analysis.conversation_move === "close" || isClosingText(userText)) {
    scores.closing += 4
  }

  if (analysis.intent === "seek_practical_help") scores.practical += 2.2
  if (analysis.intent === "ask_evidence") scores.evidence += 2.2
  if (analysis.intent === "explore_pattern") scores.reflection += 1.8
  if (analysis.intent === "understand_method") scores.info += 1.3

  if (analysis.conversation_move === "practical_preparation") scores.practical += 1.2
  if (["guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge", "synthesis"].includes(analysis.conversation_move)) {
    scores.reflection += 1.1
  }
  if (analysis.conversation_move === "direct_answer") scores.info += 0.6

  if (analysis.investigation_focus !== "none") scores.reflection += 0.9
  if (analysis.investigation_focus === "preparation") scores.practical += 1.1

  if (analysis.response_goal === "route_to_contact") scores.practical += 1.2
  if (analysis.response_goal === "answer_then_one_question") scores.reflection += 0.4
  if (analysis.response_goal === "answer_directly") scores.info += 0.2

  if (analysis.relational_state === "decision_support") scores.practical += 0.4
  if (["building_trust", "building_clarity"].includes(analysis.relational_state)) scores.reflection += 0.25

  if (/(kontakt|booking|booke|telefon|mail|pris|adresse|tid|ledige tider)/.test(t)) scores.practical += 2.2
  if (/(virker|evidens|forskning|studier|dokumentation|effekt)/.test(t)) scores.evidence += 2.2
  if (/(mønster|vant|vane|vaner|hvorfor|sker|lægge mærke|opmærksom|trang|utryg|uro|spænding|følelse|følelser)/.test(t)) scores.reflection += 0.8
  if (startsLikeGreeting(t) || /^jeg hedder\b/.test(t)) scores.info += 1.8
  if (/(hvorfor skriver du det|hvorfor spørger du|det giver ikke mening)/.test(t)) scores.info += 2.1

  const assistantTurns = transcript.filter((turn) => turn.role === "assistant").length
  if (assistantTurns <= 1) scores.info += 0.15
  if (assistantTurns >= 2) scores.reflection += 0.15

  return scores
}

function selectMode(scores: ModeScoreMap): PromptMode {
  const ordered = (Object.entries(scores) as Array<[PromptMode, number]>).sort((a, b) => b[1] - a[1])
  return ordered[0][0]
}

export function applyPolicy(params: {
  userText: string
  analysis: TurnAnalysis
  transcript: TranscriptTurn[]
}): PolicyDecision {
  const { userText, analysis, transcript } = params
  const lastEndedWithQuestion = previousAssistantEndedWithQuestion(transcript)
  const recentQuestion = hadRecentAssistantQuestion(transcript)
  const scores = computeModeScores(userText, analysis, transcript)
  const selectedMode = selectMode(scores)

  if (selectedMode === "closing") {
    return {
      allow_mode: "closing",
      allow_question: false,
      max_questions: 0,
      response_length: "short",
      require_redirect: "none",
    }
  }

  if (selectedMode === "practical") {
    return {
      allow_mode: "practical",
      allow_question: false,
      max_questions: 0,
      response_length: analysis.relational_state === "decision_support" ? "medium" : "short",
      require_redirect: analysis.response_goal === "route_to_contact" ? "contact" : "none",
    }
  }

  if (selectedMode === "evidence") {
    return {
      allow_mode: "evidence",
      allow_question: false,
      max_questions: 0,
      response_length: "medium",
      require_redirect: "none",
    }
  }

  if (selectedMode === "reflection") {
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
    !recentQuestion &&
    !startsLikeGreeting(userText)

  return {
    allow_mode: "info",
    allow_question: allowQuestion,
    max_questions: allowQuestion ? 1 : 0,
    response_length: analysis.response_goal === "close_briefly" ? "short" : "medium",
    require_redirect: "none",
  }
}
