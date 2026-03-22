import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
  preferred_style?: PreferredResponseStyle
}

export type PreferredResponseStyle = "default" | "compressed" | "challenging"

type TranscriptTurn = { role: "user" | "assistant"; content: string }
type ModeScoreMap = Record<PromptMode, number>

// --- Shared text helpers ---

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

// Single source of truth for keyword detection (was duplicated across applyPolicy + genHypno)
export function detectPracticalKeywords(text: string): boolean {
  const t = normalize(text)
  return ["kontakt", "booking", "booke", "telefon", "mail", "e-mail", "email", "pris", "adresse", "tid", "ledige tider"].some((x) => t.includes(x))
}

export function detectDirectContactRequest(text: string): boolean {
  const t = normalize(text)
  return ["kontakte", "kontakt", "ringe", "telefon", "mail", "e-mail", "email", "booke", "booking", "ledige tider", "adresse"].some((x) => t.includes(x))
}

export function detectClosingText(text: string): boolean {
  const t = text.trim().toLowerCase()
  const exact = [
    "tak", "ok tak", "okay tak", "mange tak", "fint", "super",
    "ha det godt", "hav det godt", "vi tales ved", "farvel", "hej hej",
    "det var nyttigt", "det hjælper", "det er nok", "jeg forstår",
    "ok", "okay", "godt", "forstået", "perfekt", "det lyder godt",
    "tusind tak", "tak for det", "tak skal du have",
  ]
  if (exact.includes(t)) return true
  const phrases = [
    "jeg er færdig", "lad os stoppe", "det var alt",
    "tak for hjælpen", "tak for din hjælp", "det var meget nyttigt",
    "jeg tager det med mig", "jeg tænker over det",
  ]
  return phrases.some((p) => t.includes(p))
}

function detectDifficultyWithSelfImplication(text: string): boolean {
  const t = normalize(text)
  return [
    "har svært ved", "kan ikke", "kommer ikke i gang", "holde ved", "falder tilbage",
    "går i stå", "utryg", "urolig", "tung", "træt", "modstand", "barriere", "frustreret",
  ].some((x) => t.includes(x))
}

function detectReflectionRequest(text: string): boolean {
  const t = normalize(text)
  return ["reflektere", "forstå mig selv", "hvad sker der i mig", "lægge mærke til", "opmærksom på", "mønster", "kan vi det i chatten"].some((x) => t.includes(x))
}

function detectMethodOrEvidenceQuestion(text: string): boolean {
  const t = normalize(text)
  return ["hvordan foregår", "hvordan virker", "virker det", "evidens", "dokumentation", "forskning", "studier", "hvad er hypnoterapi"].some((x) => t.includes(x))
}

function detectPracticalNextStep(text: string): boolean {
  const t = normalize(text)
  return ["næste skridt", "hvad gør jeg", "hvordan kontakter", "hvordan kan jeg kontakte", "hvordan booker", "hvad skal jeg fortælle"].some((x) => t.includes(x))
}

function detectExplicitPattern(text: string): boolean {
  const t = normalize(text)
  return [
    "hver gang", "med det samme", "jeg leder efter", "jeg søger", "jeg venter på",
    "jeg udsætter", "jeg undgår", "jeg finder en grund", "undskyldninger", "retfærdiggør",
  ].some((x) => t.includes(x))
}

// --- Transcript helpers ---

function assistantTurnCount(transcript: TranscriptTurn[]): number {
  return transcript.filter((t) => t.role === "assistant").length
}

function containsQuestion(text: string): boolean {
  return text.includes("?")
}

function previousAssistantEndedWithQuestion(transcript: TranscriptTurn[]): boolean {
  const last = [...transcript].reverse().find((t) => t.role === "assistant")
  return last ? containsQuestion(last.content) : false
}

function hadRecentAssistantQuestion(transcript: TranscriptTurn[]): boolean {
  return transcript.filter((t) => t.role === "assistant").slice(-2).some((t) => containsQuestion(t.content))
}

function recentInfoHeavyTurns(transcript: TranscriptTurn[]): number {
  return transcript.filter((t) => t.role === "assistant").slice(-3).filter((t) => t.content.length > 220 && !containsQuestion(t.content)).length
}

function inferLastAssistantMove(content: string): string {
  const t = normalize(content)
  if (!t) return "direct_answer"
  if (t.includes("?") || t.includes("hvad ") || t.includes("hvornår ")) return "guided_observation"
  if (t.includes("det ligner") || t.includes("det peger på") || t.includes("det hele ser ud til")) return "synthesis"
  if (t.includes("ikke kun") || t.includes("snarere") || t.includes("også når")) return "mild_challenge"
  if (t.includes("automatisk") || t.includes("fortolk") || t.includes("betyder")) return "metacognitive_probe"
  return "direct_answer"
}

// --- Style selection ---

function pickPreferredStyle(params: {
  chosenMode: PromptMode
  analysis: TurnAnalysis
  transcript: TranscriptTurn[]
  userText: string
}): PreferredResponseStyle {
  if (params.chosenMode !== "reflection") return "default"

  const assistantCount = assistantTurnCount(params.transcript)
  const lastAssistant = [...params.transcript].reverse().find((t) => t.role === "assistant")
  const lastMove = lastAssistant ? inferLastAssistantMove(lastAssistant.content) : null
  const currentMove = params.analysis.conversation_move
  const explicitPattern = detectExplicitPattern(params.userText)

  if (assistantCount >= 3 && explicitPattern) return "compressed"
  if (lastMove && lastMove === currentMove && explicitPattern) return "challenging"
  if (lastMove && lastMove === currentMove && assistantCount >= 2) return "compressed"
  if (explicitPattern && ["guided_observation", "metacognitive_probe"].includes(currentMove)) return "challenging"

  return "default"
}

// --- Mode selection ---

function chooseMode(params: { userText: string; analysis: TurnAnalysis; transcript: TranscriptTurn[] }): PromptMode {
  const { userText, analysis, transcript } = params

  const scores: ModeScoreMap = { info: 0, evidence: 0, practical: 0, reflection: 0, closing: 0 }

  // LLM signal (primary)
  scores[analysis.proposed_mode] += 2.2
  if (analysis.confidence >= 0.8) scores[analysis.proposed_mode] += 0.5

  // Intent signals
  if (analysis.intent === "social_closing" || analysis.conversation_move === "close") scores.closing += 5
  if (analysis.intent === "ask_evidence") scores.evidence += 2
  if (analysis.intent === "seek_practical_help") scores.practical += 1.5
  if (analysis.intent === "explore_pattern") scores.reflection += 1.8
  if (analysis.intent === "understand_method") scores.info += 1.2

  // Move signals
  if (["guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge", "synthesis"].includes(analysis.conversation_move)) {
    scores.reflection += 1.4
  }
  if (analysis.conversation_move === "practical_preparation") scores.practical += 1.2
  if (analysis.conversation_move === "direct_answer") scores.info += 0.8

  // Text-based signals (using shared detectors)
  if (detectDifficultyWithSelfImplication(userText)) { scores.reflection += 2.0; scores.info -= 1.0 }
  if (detectReflectionRequest(userText)) { scores.reflection += 2.5; scores.info -= 0.8 }
  if (detectMethodOrEvidenceQuestion(userText)) { scores.info += 1.6; scores.evidence += 1.2 }
  if (detectDirectContactRequest(userText) || detectPracticalNextStep(userText)) scores.practical += 2.2
  if (detectClosingText(userText)) scores.closing += 5

  // Penalize practical unless clearly warranted
  if (!detectDirectContactRequest(userText) && !detectPracticalNextStep(userText) && !detectPracticalKeywords(userText)) {
    scores.practical -= 1.2
  }

  // Penalize info if we've been info-heavy recently
  if (recentInfoHeavyTurns(transcript) >= 2) {
    scores.info -= 1.4
    scores.reflection += 0.8
  }

  // Route to contact if response_goal says so
  if (analysis.response_goal === "route_to_contact" && (detectDirectContactRequest(userText) || detectPracticalNextStep(userText))) {
    scores.practical += 1.5
  }

  return (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] as PromptMode) ?? analysis.proposed_mode
}

// --- Main export ---

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
  const directContact = detectDirectContactRequest(userText)
  const practicalStep = detectPracticalNextStep(userText)

  if (detectClosingText(userText) || chosenMode === "closing") {
    return { allow_mode: "closing", allow_question: false, max_questions: 0, response_length: "short", require_redirect: "none", preferred_style: "default" }
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
    return { allow_mode: "evidence", allow_question: false, max_questions: 0, response_length: "medium", require_redirect: "none", preferred_style: "default" }
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

  const allowQuestion = analysis.response_goal === "clarify_minimally" && !lastEndedWithQuestion && !recentQuestion

  return {
    allow_mode: "info",
    allow_question: allowQuestion,
    max_questions: allowQuestion ? 1 : 0,
    response_length: analysis.response_goal === "close_briefly" ? "short" : "medium",
    require_redirect: "none",
    preferred_style: "default",
  }
}
