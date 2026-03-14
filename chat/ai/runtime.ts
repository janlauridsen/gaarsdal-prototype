import { createOpenAiCompatibleClient } from "./provider"
import { AiCapability, AiCapabilityContext, AiCapabilityResult } from "./types"
import { genHypnoCapability } from "./capabilities/genHypno"
import { diaryCapability } from "./capabilities/diary"
import { focusedPatternReflectionCapability } from "./capabilities/focusedPatternReflection"

const CAPABILITIES: Record<string, AiCapability> = {
  [genHypnoCapability.id]: genHypnoCapability,
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
