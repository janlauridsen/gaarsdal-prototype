import { RMRCLogger } from "../logging/logging.writer"
import { LayerEventLog } from "../logging/logging.contract"

/**
 * Mirror AI Role (Stubbed)
 * -----------------------
 * Structural placeholder for a reflective AI role.
 *
 * Purpose:
 * - Prove AI-role orchestration
 * - Prove logging integration
 * - Avoid external dependencies
 *
 * Constraints:
 * - No advice
 * - No diagnosis
 * - No interpretation
 * - No next-step suggestions
 *
 * NOTE:
 * This implementation intentionally does NOT call an AI API.
 * It will be replaced later by a real AI adapter.
 */
export async function runMirrorAIRole(
  logger: RMRCLogger,
  params: {
    sessionId: string
    turnIndex: number
    userInput: string
  }
): Promise<string> {
  // --- STUBBED MIRROR OUTPUT ---
  const mirroredText =
    "Du beskriver en oplevelse, hvor uro opstår i situationer, der kræver noget af dig."

  const aiEvent: LayerEventLog = {
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "ai_role_invoked:mirror_stub",
  }

  await logger.logLayerEvent(aiEvent)

  return mirroredText
}
