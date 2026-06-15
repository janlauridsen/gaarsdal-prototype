import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { CHILDREN_DOMAIN } from "./domains/children"
import { runUnifiedCapability } from "./runner"

export const genChildrenCapability: AiCapability = {
  id: "gen-children-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    return runUnifiedCapability(context, llm, CHILDREN_DOMAIN)
  },
}

// Re-export so genAlcohol.ts (and any other consumer) can still import by name
export { runUnifiedCapability as runUnifiedHypnoCapability }

export default genChildrenCapability
