import { createOpenAiCompatibleClient } from "./provider"
import { AiCapability, AiCapabilityContext, AiCapabilityResult } from "./types"
import { genHypnoCapability } from "./capabilities/genHypno"
import { prequalifyCapability } from "./capabilities/prequalify"
import { clientSupportCapability } from "./capabilities/clientSupport"

const CAPABILITIES: Record<string, AiCapability> = {
  [genHypnoCapability.id]: genHypnoCapability,
  [prequalifyCapability.id]: prequalifyCapability,
  [clientSupportCapability.id]: clientSupportCapability,
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
