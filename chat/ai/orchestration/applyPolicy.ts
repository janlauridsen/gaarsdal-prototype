import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"

export type ArousalLevel = "low" | "elevated" | "high"

export type PolicyDecision = {
  allow_mode: PromptMode
  allow_question: boolean
  max_questions: 0 | 1
  response_length: "short" | "medium"
  require_redirect?: "contact" | "none"
  preferred_style?: PreferredResponseStyle
  arousal_level: ArousalLevel
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
  return ["kontakt", "booking", "booke", "telefon", "mail", "e-mail", "email", "pris", "koster", "koste", "betale", "betaling", "adresse", "tid", "ledige tider"].some((x) => t.includes(x))
}

export function detectDirectContactRequest(text: string): boolean {
  const t = normalize(text)
  return ["kontakte", "kontakt", "ringe", "telefon", "mail", "e-mail", "email", "booke", "booking", "ledige tider", "adresse"].some((x) => t.includes(x))
}

export function detectHistoryQuery(text: string): boolean {
  const t = text.trim().toLowerCase()
  return [
    "hvad har jeg fortalt", "hvad har du lært", "hvad ved du om mig",
    "vide hvad du ved", "ved du noget om", "vil gerne vide hvad du",
    "hvad husker du", "hvad kender du til", "hvad har vi talt om",
    "hvad har vi snakket om", "hvad har jeg delt", "hvad har jeg sagt",
    "hvad ved du", "fortæl mig hvad du ved", "kan du opsummere hvad",
    "hvad har du noteret", "hvad har du gemt", "hvad har du opfanget",
    "kan du huske hvad", "husker du hvad", "ved du noget om mig",
  ].some((p) => t.includes(p))
}

export function detectContinuationIntent(text: string): boolean {
  const t = text.trim().toLowerCase()
  return [
    "kan vi skrive videre", "kan vi fortsætte", "lad os fortsætte",
    "vil gerne fortsætte", "vil gerne skrive videre",
    "vi kan godt fortsætte", "fortsæt", "fortæl mere",
    "hvad mere", "hvad ellers", "og hvad så",
    // Emne-skift er IKKE afslutninger
    "noget andet", "tale om andet", "skifte emne", "andet emne",
    "nyt emne", "noget nyt", "andet på hjerte", "trænger til at tale",
    "vil gerne tale om", "har noget andet",
  ].some((p) => t.includes(p))
}

export function detectClosingText(text: string): boolean {
  const t = text.trim().toLowerCase()
  const exact = [
    "tak", "ok tak", "okay tak", "mange tak",
    "ha det godt", "hav det godt", "vi tales ved", "farvel", "hej hej",
    "det var nyttigt", "det hjælper", "det er nok",
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

// ─── Window of Tolerance arousal detection ───────────────────────────────────
// Teori: Siegel / Ogden — Somatic/Polyvagal
// Scorer sproglige markører for arousal-niveau pr. turn.

export function scoreArousalTurn(text: string): number {
  const t = text.trim()
  if (!t) return 0

  let score = 0
  const words = t.split(/\s+/)
  const wordCount = words.length

  // Hyperarousal: katastrofesprog
  const catastrophe = ["aldrig", "altid", "umuligt", "håbløst", "haabloest", "ingenting", "ødelægger", "oedelaegger", "komplet fiasko"]
  if (catastrophe.some((x) => normalize(t).includes(x))) score += 0.25

  // Hyperarousal: intensitetsord
  const intensity = ["virkelig", "ekstremt", "så meget", "saa meget", "utroligt", "sindssygt", "fuldstændig", "fuldstaendig", "ufatteligt"]
  if (intensity.some((x) => normalize(t).includes(x))) score += 0.15

  // Hyperarousal: temporal pres
  const urgency = ["jeg kan ikke mere", "det er for meget", "jeg holder ikke ud", "jeg bryder sammen"]
  if (urgency.some((x) => normalize(t).includes(x))) score += 0.25

  // Hyperarousal: udråbstegn (> 1)
  const exclamations = (t.match(/!/g) ?? []).length
  if (exclamations >= 2) score += 0.15
  else if (exclamations === 1) score += 0.05

  // Hyperarousal: fragmenteret (lav gennemsnitlig ordlængde)
  if (wordCount >= 3) {
    const avgWordLen = t.replace(/\s+/g, "").length / wordCount
    if (avgWordLen < 3.5) score += 0.10
  }

  // Hypoarousal: meget kort svar (konservativt = samme bremse)
  if (wordCount <= 3) score += 0.20

  // Hypoarousal: passivt/lukkende sprog
  const normalized = normalize(t)
  const passive = ["ligemeget", "ved ikke", "måske", "maaske", "det er fint", "uanset"]
  const passiveMatches = passive.filter((x) => normalized === x || normalized.startsWith(x + " ") || normalized.endsWith(" " + x)).length
  if (passiveMatches >= 2) score += 0.25
  else if (passiveMatches === 1 && wordCount <= 5) score += 0.15

  // Hypoarousal: fravær af verber i sætning med 4+ ord
  const hasVerb = ["er", "har", "kan", "vil", "gør", "tænker", "føler", "prøver", "ved", "sker"].some((v) => normalized.split(/\s+/).includes(v))
  if (!hasVerb && wordCount >= 4) score += 0.10

  return Math.min(1, score)
}

/**
 * Beregner rolling arousal-level fra seneste bruger-turns.
 * Nyeste turn vægter 0.6, næstnyeste 0.3, den før 0.1.
 * previousScore (fra meta) bidrager med 20% inertia mod pludselige skift.
 */
export function computeRollingArousal(
  transcript: TranscriptTurn[],
  currentUserText: string,
  previousScore = 0
): { level: ArousalLevel; score: number } {
  const userTurns = transcript.filter((t) => t.role === "user").slice(-2)

  const s0 = userTurns[0] ? scoreArousalTurn(userTurns[0].content) : 0
  const s1 = userTurns[1] ? scoreArousalTurn(userTurns[1].content) : 0
  const s2 = scoreArousalTurn(currentUserText)

  const weighted = s0 * 0.1 + s1 * 0.3 + s2 * 0.6
  const blended = previousScore * 0.2 + weighted * 0.8

  const level: ArousalLevel =
    blended >= 0.55 ? "high" :
    blended >= 0.30 ? "elevated" :
    "low"

  return { level, score: Math.round(blended * 1000) / 1000 }
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
  // Closing styres udelukkende af LLM intent (social_closing) — ingen regex-override her

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
  arousalLevel?: ArousalLevel
}): PolicyDecision {
  const { userText, analysis, transcript } = params
  const arousalLevel: ArousalLevel = params.arousalLevel ?? "low"
  const lastEndedWithQuestion = previousAssistantEndedWithQuestion(transcript)
  const recentQuestion = hadRecentAssistantQuestion(transcript)
  const chosenMode = chooseMode(params)
  const preferredStyle = pickPreferredStyle({ chosenMode, analysis, transcript, userText })
  const directContact = detectDirectContactRequest(userText)
  const practicalStep = detectPracticalNextStep(userText)

  // ── Window of Tolerance override ──────────────────────────────────────────
  // Hvis arousal er høj: sæt farten ned uanset mode.
  // Ingen spørgsmål, kort svar, bevar valgt mode (vi skifter ikke til et andet emne).
  if (arousalLevel === "high") {
    return {
      allow_mode: chosenMode === "closing" ? "closing" : chosenMode,
      allow_question: false,
      max_questions: 0,
      response_length: "short",
      require_redirect: directContact ? "contact" : "none",
      preferred_style: "default",
      arousal_level: "high",
    }
  }

  if (chosenMode === "closing") {
    return { allow_mode: "closing", allow_question: false, max_questions: 0, response_length: "short", require_redirect: "none", preferred_style: "default", arousal_level: arousalLevel }
  }

  if (chosenMode === "practical") {
    return {
      allow_mode: "practical",
      allow_question: false,
      max_questions: 0,
      response_length: analysis.relational_state === "decision_support" || practicalStep ? "medium" : "short",
      require_redirect: directContact ? "contact" : "none",
      preferred_style: "default",
      arousal_level: arousalLevel,
    }
  }

  if (chosenMode === "evidence") {
    return { allow_mode: "evidence", allow_question: false, max_questions: 0, response_length: "medium", require_redirect: "none", preferred_style: "default", arousal_level: arousalLevel }
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
      arousal_level: arousalLevel,
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
    arousal_level: arousalLevel,
  }
}
