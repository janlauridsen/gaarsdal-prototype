/**
 * Mirror Role (Stub)
 * ------------------
 * Structural placeholder for the "Spejler" role.
 *
 * - No AI
 * - No interpretation
 * - No text generation
 * - Logs invocation using an existing, valid LayerId
 */

import { RMRCLogger } from "../logging/logging.writer"

type MirrorRoleParams = {
  sessionId: string
  turnIndex: number
}

export async function runMirrorRole(
  logger: RMRCLogger,
  params: MirrorRoleParams
): Promise<void> {
  await logger.logLayerEvent({
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "role_invoked",
  })
}
