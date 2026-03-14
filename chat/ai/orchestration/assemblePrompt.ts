import { FinalResponse } from "../contracts/responseContract"
import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"
import { BASE_ROLE_PROMPT } from "../prompts/baseRole"
import { DOMAIN_BOUNDARY_PROMPT } from "../prompts/domainBoundary"
import { FORMAT_ANSWER_PLUS_ONE_QUESTION_PROMPT } from "../prompts/formats/answerPlusOneQuestion"
import { FORMAT_BRIEF_CLOSE_PROMPT } from "../prompts/formats/briefClose"
import { FORMAT_DIRECT_ANSWER_PROMPT } from "../prompts/formats/directAnswer"
import { MODE_CLOSING_PROMPT } from "../prompts/modes/closing"
import { MODE_EVIDENCE_PROMPT } from "../prompts/modes/evidence"
import { MODE_INFO_PROMPT } from "../prompts/modes/info"
import { MODE_PRACTICAL_PROMPT } from "../prompts/modes/practical"
import { MODE_REFLECTION_PROMPT } from "../prompts/modes/reflection"
import { SAFETY_PROMPT } from "../prompts/safety"
import { TONE_CALM_NEUTRAL_PROMPT } from "../prompts/tones/calmNeutral"
import { PolicyDecision } from "./applyPolicy"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

function getModePrompt(mode: PromptMode): string {
  switch (mode) {
    case "evidence":
      return MODE_EVIDENCE_PROMPT
    case "practical":
      return MODE_PRACTICAL_PROMPT
    case "reflection":
      return MODE_REFLECTION_PROMPT
    case "closing":
      return MODE_CLOSING_PROMPT
    case "info":
    default:
      return MODE_INFO_PROMPT
  }
}

function getFormatPrompt(policy: PolicyDecision): string {
  if (policy.allow_mode === "closing") return FORMAT_BRIEF_CLOSE_PROMPT
  if (policy.max_questions === 1) return FORMAT_ANSWER_PLUS_ONE_QUESTION_PROMPT
  return FORMAT_DIRECT_ANSWER_PROMPT
}

export function assembleResponseMessages(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
}): Array<{ role: "system" | "user"; content: string }> {
  const systemPrompt = [
    BASE_ROLE_PROMPT,
    DOMAIN_BOUNDARY_PROMPT,
    SAFETY_PROMPT,
    getModePrompt(params.policy.allow_mode),
    TONE_CALM_NEUTRAL_PROMPT,
    getFormatPrompt(params.policy),
    `Policy decision:\n- allow_mode: ${params.policy.allow_mode}\n- allow_question: ${params.policy.allow_question}\n- max_questions: ${params.policy.max_questions}\n- response_length: ${params.policy.response_length}\n- require_redirect: ${params.policy.require_redirect ?? "none"}`,
    `Returner kun gyldig JSON:\n{\n  "assistant_message": string,\n  "topic": string | null,\n  "objective": string | null,\n  "mode_used": "info" | "evidence" | "practical" | "reflection" | "closing"\n}`,
  ].join("\n\n")

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify({
        analysis: params.analysis,
        policy: params.policy,
        last_topic: params.lastTopic ?? "",
        transcript: params.transcript,
        user_input: params.userText,
      }),
    },
  ]
}
