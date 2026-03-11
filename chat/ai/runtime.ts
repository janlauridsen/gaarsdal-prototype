import { createOpenAiCompatibleClient } from "./provider"
import { AiCapability, AiCapabilityContext, AiCapabilityResult } from "./types"
import { triageCapability } from "./capabilities/triage"
import { genHypnoCapability } from "./capabilities/genHypno"
import { methodFitCapability } from "./capabilities/methodFit"
import { reflectionCapability } from "./capabilities/reflection"
import { diaryCapability } from "./capabilities/diary"
import { focusedPatternReflectionCapability } from "./capabilities/focusedPatternReflection"

const CAPABILITIES: Record<string, AiCapability> = {
  [triageCapability.id]: triageCapability,
  [genHypnoCapability.id]: genHypnoCapability,
  [methodFitCapability.id]: methodFitCapability,
  [reflectionCapability.id]: reflectionCapability,
  [diaryCapability.id]: diaryCapability,
  [focusedPatternReflectionCapability.id]: focusedPatternReflectionCapability,
}

export async function runCapability(
  capabilityId: string,
  context: AiCapabilityContext
): Promise<AiCapabilityResult> {
  const capability = CAPABILITIES[capabilityId]
  if (!capability) {
    throw new Error(`unknown capability: ${capabilityId}`)
  }

  const llm = createOpenAiCompatibleClient()
  return capability.run(context, llm)
}
