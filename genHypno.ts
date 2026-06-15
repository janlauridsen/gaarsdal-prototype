import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { STANDARD_DOMAIN } from "./domains/standard"
import { runUnifiedCapability } from "./runner"

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    return runUnifiedCapability(context, llm, STANDARD_DOMAIN)
  },
}

// Re-export for consumers that import runUnifiedHypnoCapability by name
export { runUnifiedCapability as runUnifiedHypnoCapability }

export default genHypnoCapability
