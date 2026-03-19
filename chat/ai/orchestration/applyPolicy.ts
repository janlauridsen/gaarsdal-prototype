import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
  preferred_style?: PreferredResponseStyle
}

type TranscriptTurn = { role: "user" | "assistant"; content: string }

export type PreferredResponseStyle = "default" | "compressed" | "challenging"

type ModeScoreMap = Record<PromptMode, number>

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function inferAssistantMove(content: string): ConversationMoveLike {
  const t = normalize(content)
  if (!t) return "direct_answer"
  if (t.includes("?") || t.includes("hvad ") || t.includes("hvornår ") || t.includes("hvilken ")) return "guided_observation"
  if (t.includes("det ligner") || t.includes("det peger på") || t.includes("det sker") || t.includes("det hele ser ud til")) return "synthesis"
  if (t.includes("ikke kun") || t.includes("mere end") || t.includes("snarere") || t.includes("også når") || t.includes("bliver din måde")) return "mild_challenge"
  if (t.includes("automatisk") || t.includes("reguleringsstrategi") || t.includes("fortolk") || t.includes("betyder")) return "metacognitive_probe"
  return "direct_answer"
}

type ConversationMoveLike = "direct_answer" | "guided_observation" | "metacognitive_probe" | "mild_challenge" | "synthesis"

function lastAssistantMove(transcript: TranscriptTurn[]): ConversationMoveLike | null {
  const lastAssistant = [...transcript].reverse().find((turn) => turn.role === "assistant")
  return lastAssistant ? inferAssistantMove(lastAssistant.content) : null
}

function assistantTurnCount(transcript: TranscriptTurn[]): number {
  return transcript.filter((turn) => turn.role === "assistant").length
}

function mentionsExplicitPattern(text: string): boolean {
  const t = normalize(text)
  return [
    "hver gang",
    "med det samme",
    "jeg leder efter",
    "jeg søger",
    "jeg venter på",
    "jeg udsætter",
    "jeg undgår",
    "jeg finder en grund",
    "undskyldninger",
    "retfærdiggør",
  ].some((x) => t.includes(x))
}

function pickPreferredStyle(params: {
  chosenMode: PromptMode
  analysis: TurnAnalysis
  transcript: TranscriptTurn[]
  userText: string
}): PreferredResponseStyle {
  if (params.chosenMode !== "reflection") return "default"

  const assistantCount = assistantTurnCount(params.transcript)
  const lastMove = lastAssistantMove(params.transcript)
  const currentMove = params.analysis.conversation_move
  const explicitPattern = mentionsExplicitPattern(params.userText)

  if (assistantCount >= 3 && explicitPattern) return "compressed"
  if (lastMove && lastMove === currentMove && explicitPattern) return "challenging"
  if (lastMove && lastMove === currentMove && assistantCount >= 2) return "compressed"
  if (explicitPattern && ["guided_observation", "metacognitive_probe"].includes(currentMove)) return "challenging"

  return "default"
}

function isPracticalKeyword(text: string): boolean {
  const t = normalize(text)
  return ["kontakt", "booking", "booke", "telefon", "mail", "pris", "adresse", "tid", "ledige tider", "email", "e-mail"].some((x) => t.includes(x))
}

function isDirectContactRequest(text: string): boolean {
  const t = normalize(text)
  return ["kontakte", "kontakt", "ringe", "telefon", "mail", "e-mail", "email", "booke", "booking", "ledige tider", "adresse"].some((x) => t.includes(x))
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

function countRecentAssistantModes(transcript: TranscriptTurn[]): { questionTurns: number; infoLikeTurns: number } {
  const lastAssistantTurns = transcript.filter((turn) => turn.role === "assistant").slice(-3)
  return {
    questionTurns: lastAssistantTurns.filter((turn) => containsQuestion(turn.content)).length,
    infoLikeTurns: lastAssistantTurns.filter((turn) => turn.content.length > 220 && !containsQuestion(turn.content)).length,
  }
}

function mentionsDifficultyWithSelfImplication(text: string): boolean {
  const t = normalize(text)
  const difficulty = [
    "har svært ved",
    "kan ikke",
    "kommer ikke i gang",
    "holde ved",
    "falder tilbage",
    "går i stå",
    "ud af de følelser",
    "utryg",
    "urolig",
    "tung",
    "træt",
    "modstand",
    "barriere",
    "frustreret",
  ]
  const desire = ["vil gerne", "ønsker", "prøver", "overvejer", "jeg vil", "jeg ønsker"]
  return difficulty.some((x) => t.includes(x)) || (desire.some((x) => t.includes(x)) && difficulty.some((x) => t.includes(x)))
}

function asksForReflection(text: string): boolean {
  const t = normalize(text)
  return ["reflektere", "forstå mig selv", "hvad sker der i mig", "lægge mærke til", "opmærksom på", "mønster", "kan vi det i chatten"].some((x) => t.includes(x))
}

function asksForMethodOrEvidence(text: string): boolean {
  const t = normalize(text)
  return ["hvordan foregår", "hvordan virker", "virker det", "evidens", "dokumentation", "forskning", "studier", "hvad er hypnoterapi"].some((x) => t.includes(x))
}

function asksForPracticalNextStep(text: string): boolean {
  const t = normalize(text)
  return ["næste skridt", "hvad gør jeg", "hvordan kontakter", "hvordan kan jeg kontakte", "hvordan booker", "hvad skal jeg fortælle"].some((x) => t.includes(x))
}

function chooseMode(params: { userText: string; analysis: TurnAnalysis; transcript: TranscriptTurn[] }): PromptMode {
  const { userText, analysis, transcript } = params
  const t = normalize(userText)
  const modeScores: ModeScoreMap = {
    info: 0,
    evidence: 0,
    practical: 0,
    reflection: 0,
    closing: 0,
  }

  modeScores[analysis.proposed_mode] += 2.2
  if (analysis.confidence >= 0.8) modeScores[analysis.proposed_mode] += 0.5

  if (analysis.intent === "social_closing" || analysis.conversation_move === "close") modeScores.closing += 5
  if (analysis.intent === "ask_evidence") modeScores.evidence += 2
  if (analysis.intent === "seek_practical_help") modeScores.practical += 1.5
  if (analysis.intent === "explore_pattern") modeScores.reflection += 1.8
  if (analysis.intent === "understand_method") modeScores.info += 1.2

  if (["guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge", "synthesis"].includes(analysis.conversation_move)) {
    modeScores.reflection += 1.4
  }
  if (analysis.conversation_move === "practical_preparation") modeScores.practical += 1.2
  if (analysis.conversation_move === "direct_answer") modeScores.info += 0.8

  if (mentionsDifficultyWithSelfImplication(t)) {
    modeScores.reflection += 2.0
    modeScores.info -= 1.0
  }

  if (asksForReflection(t)) {
    modeScores.reflection += 2.5
    modeScores.info -= 0.8
  }

  if (asksForMethodOrEvidence(t)) {
    modeScores.info += 1.6
    modeScores.evidence += 1.2
  }

  if (isDirectContactRequest(t) || asksForPracticalNextStep(t)) {
    modeScores.practical += 2.2
  }

  const recent = countRecentAssistantModes(transcript)
  if (recent.infoLikeTurns >= 2) {
    modeScores.info -= 1.4
    modeScores.reflection += 0.8
  }

  if (!isDirectContactRequest(t) && !asksForPracticalNextStep(t) && !isPracticalKeyword(t)) {
    modeScores.practical -= 1.2
  }

  if (analysis.response_goal === "route_to_contact" && (isDirectContactRequest(t) || asksForPracticalNextStep(t))) {
    modeScores.practical += 1.5
  }

  if (isClosingText(userText)) modeScores.closing += 5

  return (Object.entries(modeScores).sort((a, b) => b[1] - a[1])[0]?.[0] as PromptMode) ?? analysis.proposed_mode
}

export function applyPolicy(params: {
  userText: string
  analysis: TurnAnalysis
  transcript: TranscriptTurn[]
}): PolicyDecision {
  const { userText, analysis, transcript } = params
  const lastEndedWithQuestion = previousAssistantEndedWithQuestion(transcript)
  const recentQuestion = hadRecentAssistantQuestion(transcript)
  const chosenMode = chooseMode(params)
  const preferredStyle = pickPreferredStyle({ chosenMode, analysis, transcript, userText })
  const directContact = isDirectContactRequest(userText)
  const practicalStep = asksForPracticalNextStep(userText)

  if (isClosingText(userText) || chosenMode === "closing") {
    return {
      allow_mode: "closing",
      allow_question: false,
      max_questions: 0,
      response_length: "short",
      require_redirect: "none",
      preferred_style: "default",
    }
  }

  if (chosenMode === "practical") {
    return {
      allow_mode: "practical",
      allow_question: false,
      max_questions: 0,
      response_length: analysis.relational_state === "decision_support" || practicalStep ? "medium" : "short",
      require_redirect: directContact ? "contact" : "none",
      preferred_style: "default",
    }
  }

  if (chosenMode === "evidence") {
    return {
      allow_mode: "evidence",
      allow_question: false,
      max_questions: 0,
      response_length: "medium",
      require_redirect: "none",
      preferred_style: "default",
    }
  }

  if (chosenMode === "reflection") {
    const allowQuestion =
      !lastEndedWithQuestion &&
      !recentQuestion &&
      ["guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge"].includes(analysis.conversation_move)

    return {
      allow_mode: "reflection",
      allow_question: allowQuestion,
      max_questions: allowQuestion ? 1 : 0,
      response_length: "medium",
      require_redirect: "none",
      preferred_style: preferredStyle,
    }
  }

  const allowQuestion =
    analysis.response_goal === "clarify_minimally" &&
    !lastEndedWithQuestion &&
    !recentQuestion

  return {
    allow_mode: "info",
    allow_question: allowQuestion,
    max_questions: allowQuestion ? 1 : 0,
    response_length: analysis.response_goal === "close_briefly" ? "short" : "medium",
    require_redirect: "none",
    preferred_style: "default",
  }
}
