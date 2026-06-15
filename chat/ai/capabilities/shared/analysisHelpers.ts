import { PromptMode, RelationalState, TurnAnalysis } from "../../contracts/turnAnalysis"
import { SingleTurnOutput } from "../../orchestration/singleTurnCall"

export function buildDefaultAnalysis(
  userText: string,
  previousTopic?: string,
  forcedMode?: Exclude<PromptMode, "closing">,
): TurnAnalysis {
  return {
    intent:
      forcedMode === "reflection" ? "explore_pattern" : forcedMode === "evidence" ? "ask_evidence" : "understand_method",
    proposed_mode: forcedMode ?? "info",
    conversation_move:
      forcedMode === "reflection"
        ? "guided_observation"
        : forcedMode === "practical"
          ? "practical_preparation"
          : "direct_answer",
    investigation_focus:
      forcedMode === "reflection" ? "attention" : forcedMode === "practical" ? "preparation" : "none",
    response_goal: forcedMode ? "answer_then_one_question" : "answer_directly",
    relational_state:
      forcedMode === "reflection" ? "building_trust" : forcedMode === "practical" ? "decision_support" : "orienting",
    routing_intent: "none",
    is_history_query: false,
    topic: previousTopic,
    sensitivity: "low",
    signals: ["fallback"],
    confidence: 0.3,
  }
}

export function outputToAnalysis(out: SingleTurnOutput, previousTopic?: string): TurnAnalysis {
  return {
    intent: "understand_method",
    proposed_mode: out.mode_used,
    conversation_move: out.conversation_move,
    investigation_focus: out.investigation_focus,
    response_goal: "answer_then_one_question",
    relational_state: out.relational_state,
    routing_intent: "none",
    is_history_query: out.is_history_query,
    topic: out.topic ?? previousTopic,
    objective: out.objective,
    sensitivity: "low",
    signals: out.signals,
    confidence: out.confidence,
  }
}
