import { ArousalLevel } from "../../orchestration/applyPolicy"
import { PromptMode, RelationalState, TurnAnalysis } from "../../contracts/turnAnalysis"
import { AiCapabilityContext } from "../../types"
import { countAssistantTurns, readTranscriptByKey, TranscriptTurn } from "./transcriptHelpers"

export function buildMetaDelta(params: {
  context: AiCapabilityContext
  assistantMessage: string
  updatedTranscript: TranscriptTurn[]
  topic: string | undefined
  sourceNode: string
  transcriptKey: string
  userText: string
  analysis: TurnAnalysis
  mode: PromptMode
  objective?: string
  relationalState: RelationalState
  arousalScore?: number
  arousalLevel?: ArousalLevel
}): Record<string, unknown> {
  // Domæne-prefix udledt af transcriptKey:
  //   "gen_hypno.transcript"    → "gen_hypno"
  //   "gen_children.transcript" → "gen_children"
  //   "gen_alcohol.transcript"  → "gen_alcohol"
  const mp = params.transcriptKey.replace(/\.transcript$/, "")

  const previousTranscript = readTranscriptByKey(params.context, params.transcriptKey)
  const prevAssistantCount = countAssistantTurns(previousTranscript)
  const nextAssistantCount = params.assistantMessage ? prevAssistantCount + 1 : prevAssistantCount

  const dialogStage =
    params.mode === "closing"
      ? "close"
      : prevAssistantCount <= 1
        ? "open"
        : prevAssistantCount <= 3
          ? "deepening"
          : "closing"

  const derivedTopicTags = params.topic ? [params.topic] : []
  const derivedProblemTitle = params.analysis.topic ?? params.topic
  const derivedProblemSummary =
    params.analysis.objective ??
    (params.topic ? `Ønske om at forstå mønstre relateret til ${params.topic}.` : undefined)

  const meta: Record<string, unknown> = {
    [params.transcriptKey]: params.updatedTranscript,
    [`${mp}.assistant_turn_count`]: nextAssistantCount,
    "dialog.mode": params.mode,
    "dialog.move": params.analysis.conversation_move,
    "dialog.investigation_focus": params.analysis.investigation_focus,
    "dialog.stage": dialogStage,
    "dialog.relational_state": params.relationalState,
    [`${mp}.analysis`]: params.analysis,
  }

  if (params.topic) {
    meta[`${mp}.last_topic`] = params.topic
    meta["dialog.topic"] = params.topic
    meta["focused_reflection.topic"] = params.topic
  }
  if (params.objective) meta["dialog.objective"] = params.objective
  if (params.mode === "reflection") {
    meta["focused_reflection.entry_source"] = params.sourceNode
    meta["focused_reflection.user_opt_in"] = true
    meta["focused_reflection.stage"] = "OPEN"
  }
  if (params.mode !== "closing") {
    meta["focused_reflection.transcript"] = params.updatedTranscript
  }
  if (params.mode === "closing") meta["focused_reflection.stage"] = "CLOSED"
  if (derivedProblemTitle) meta[`${mp}.problem_title`] = derivedProblemTitle
  if (derivedProblemSummary) meta[`${mp}.problem_summary`] = derivedProblemSummary
  if (derivedTopicTags.length) meta[`${mp}.topic_tags`] = derivedTopicTags
  if (typeof params.arousalScore === "number") meta["wot.arousal_score"] = params.arousalScore
  if (params.arousalLevel) meta["wot.arousal_level"] = params.arousalLevel

  return meta
}
