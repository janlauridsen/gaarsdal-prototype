// chat/ai/capabilities/genAlcohol.ts
// Specialiseret alkohol-assistent. Genbruger den unified hypno-capability
// med domain: "alcohol", som aktiverer alkohol-domæneblokken i buildSystemPrompt.
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { runUnifiedHypnoCapability } from "./genChildren"

export const genAlcoholCapability: AiCapability = {
  id: "gen-alcohol-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    return runUnifiedHypnoCapability(context, llm, {
      transcriptKey: "gen_alcohol.transcript",
      sourceNode: "HOME_ALCOHOL",
      stayOnNode: "HOME_ALCOHOL",
      domain: "alcohol",
    })
  },
}

export default genAlcoholCapability
