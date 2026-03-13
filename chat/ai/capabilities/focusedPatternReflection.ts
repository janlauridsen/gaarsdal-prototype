import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmClient,
} from "../types"
import { runUnifiedHypnoCapability } from "./genHypno"

export const focusedPatternReflectionCapability: AiCapability = {
  id: "focused-pattern-reflection-v1",

  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    return runUnifiedHypnoCapability(context, llm, {
      transcriptKey: "focused_reflection.transcript",
      sourceNode: "FOCUSED_PATTERN_REFLECTION",
      stayOnNode: "FOCUSED_PATTERN_REFLECTION",
      forcedMode: "guided_reflection",
    })
  },
}

export default focusedPatternReflectionCapability
