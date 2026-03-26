export type PromptMode = "info" | "evidence" | "practical" | "reflection" | "closing"

export type ConversationMove =
  | "direct_answer"
  | "guided_observation"
  | "pattern_detection"
  | "metacognitive_probe"
  | "mild_challenge"
  | "practical_preparation"
  | "synthesis"
  | "close"

export type InvestigationFocus =
  | "attention"
  | "interpretation"
  | "regulation"
  | "pattern"
  | "preparation"
  | "none"

export type TurnIntent =
  | "understand_method"
  | "ask_evidence"
  | "seek_practical_help"
  | "explore_pattern"
  | "social_closing"
  | "unclear"

export type ResponseGoal =
  | "answer_directly"
  | "answer_then_one_question"
  | "clarify_minimally"
  | "close_briefly"
  | "route_to_contact"

export type RelationalState =
  | "orienting"
  | "building_clarity"
  | "building_trust"
  | "decision_support"
  | "gentle_close"

/**
 * Eksplicit routing-beslutning fra LLM — erstatter keyword-baseret pre-routing.
 *
 * contact_booking: brugeren vil booke eller kontakte Jan direkte (→ HANDOFF_FORM)
 * lead_capture:    brugeren er interesseret men ikke klar endnu (→ LEAD_CAPTURE)
 * fit_check:       brugeren vil vide om hypnoterapi passer til dem (→ PREQUALIFY)
 * none:            ingen special routing — fortsæt i GEN_HYPNO
 *
 * LLM'en vurderer intent i kontekst og kan skelne "inden jeg booker" fra "jeg vil booke".
 */
export type RoutingIntent =
  | "contact_booking"
  | "lead_capture"
  | "fit_check"
  | "none"

export type TurnAnalysis = {
  intent: TurnIntent
  proposed_mode: PromptMode
  conversation_move: ConversationMove
  investigation_focus: InvestigationFocus
  response_goal: ResponseGoal
  relational_state: RelationalState
  routing_intent: RoutingIntent
  topic?: string
  objective?: string
  sensitivity: "low" | "medium" | "high"
  signals: string[]
  confidence: number
}

export function normalizeTurnAnalysis(raw: Record<string, unknown> | null): TurnAnalysis | null {
  if (!raw) return null

  const intent = typeof raw.intent === "string" ? raw.intent : "unclear"
  const proposed_mode = typeof raw.proposed_mode === "string" ? raw.proposed_mode : "info"
  const conversation_move = typeof raw.conversation_move === "string" ? raw.conversation_move : "direct_answer"
  const investigation_focus = typeof raw.investigation_focus === "string" ? raw.investigation_focus : "none"
  const response_goal = typeof raw.response_goal === "string" ? raw.response_goal : "answer_directly"
  const relational_state = typeof raw.relational_state === "string" ? raw.relational_state : "orienting"
  const sensitivity = typeof raw.sensitivity === "string" ? raw.sensitivity : "low"
  const topic = typeof raw.topic === "string" && raw.topic.trim() ? raw.topic.trim() : undefined
  const objective = typeof raw.objective === "string" && raw.objective.trim() ? raw.objective.trim() : undefined
  const signals = Array.isArray(raw.signals)
    ? raw.signals.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean).slice(0, 8)
    : []
  const confidenceRaw = typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence)
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.5
  // routing_intent: default "none" hvis ikke leveret — bagudkompatibelt
  const routing_intent = typeof raw.routing_intent === "string" ? raw.routing_intent : "none"

  const validMode = ["info", "evidence", "practical", "reflection", "closing"].includes(proposed_mode)
  const validMove = [
    "direct_answer",
    "guided_observation",
    "pattern_detection",
    "metacognitive_probe",
    "mild_challenge",
    "practical_preparation",
    "synthesis",
    "close",
  ].includes(conversation_move)
  const validFocus = ["attention", "interpretation", "regulation", "pattern", "preparation", "none"].includes(investigation_focus)
  const validIntent = [
    "understand_method",
    "ask_evidence",
    "seek_practical_help",
    "explore_pattern",
    "social_closing",
    "unclear",
  ].includes(intent)
  const validGoal = [
    "answer_directly",
    "answer_then_one_question",
    "clarify_minimally",
    "close_briefly",
    "route_to_contact",
  ].includes(response_goal)
  const validRelationalState = [
    "orienting",
    "building_clarity",
    "building_trust",
    "decision_support",
    "gentle_close",
  ].includes(relational_state)
  const validSensitivity = ["low", "medium", "high"].includes(sensitivity)
  const validRoutingIntent = ["contact_booking", "lead_capture", "fit_check", "none"].includes(routing_intent)

  if (!validMode || !validMove || !validFocus || !validIntent || !validGoal || !validRelationalState || !validSensitivity) return null

  return {
    intent: intent as TurnIntent,
    proposed_mode: proposed_mode as PromptMode,
    conversation_move: conversation_move as ConversationMove,
    investigation_focus: investigation_focus as InvestigationFocus,
    response_goal: response_goal as ResponseGoal,
    relational_state: relational_state as RelationalState,
    routing_intent: (validRoutingIntent ? routing_intent : "none") as RoutingIntent,
    topic,
    objective,
    sensitivity: sensitivity as "low" | "medium" | "high",
    signals,
    confidence,
  }
}
