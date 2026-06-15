import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { ALCOHOL_DOMAIN } from "./domains/alcohol"
import { runUnifiedCapability } from "./runner"

export const genAlcoholCapability: AiCapability = {
  id: "gen-alcohol-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    return runUnifiedCapability(context, llm, ALCOHOL_DOMAIN)
  },
}

export default genAlcoholCapability
