export type PromptMode = "info" | "evidence" | "practical" | "reflection" | "closing"

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

export type TurnAnalysis = {
  intent: TurnIntent
  proposed_mode: PromptMode
  response_goal: ResponseGoal
  relational_state: RelationalState
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

  const validMode = ["info", "evidence", "practical", "reflection", "closing"].includes(proposed_mode)
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

  if (!validMode || !validIntent || !validGoal || !validRelationalState || !validSensitivity) return null

  return {
    intent: intent as TurnIntent,
    proposed_mode: proposed_mode as PromptMode,
    response_goal: response_goal as ResponseGoal,
    relational_state: relational_state as RelationalState,
    topic,
    objective,
    sensitivity: sensitivity as "low" | "medium" | "high",
    signals,
    confidence,
  }
}
