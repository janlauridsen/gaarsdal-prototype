import { RMRCLogger } from "../logging/logging.writer"
import { LayerEventLog } from "../logging/logging.contract"
import OpenAI from "openai"

/**
 * Mirror AI Role (Minimal)
 * -----------------------
 * Produces a short reflective mirroring of user input.
 *
 * Constraints:
 * - No advice
 * - No diagnosis
 * - No interpretation
 * - No next-step suggestions
 */
export async function runMirrorAIRole(
  logger: RMRCLogger,
  params: {
    sessionId: string
    turnIndex: number
    userInput: string
  }
): Promise<string> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const systemPrompt = `
You are a reflective mirror.
Your task is to restate the user's experience in neutral, tentative language.

Rules:
- Do not advise
- Do not explain
- Do not diagnose
- Do not suggest actions
- Keep it short (1–3 sentences)
- Preserve ambiguity
`

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: params.userInput },
    ],
  })

  const content =
    response.choices[0]?.message?.content ?? ""

  const aiEvent: LayerEventLog = {
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "ai_role_invoked:mirror",
  }

  await logger.logLayerEvent(aiEvent)

  return content
}
