/**
 * Mirror Role (Stub)
 * ------------------
 * This is a structural placeholder for the "Spejler" role.
 *
 * - No AI
 * - No interpretation
 * - No text generation
 * - Logs only that the role was invoked
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
    layer: "mirror",
    event: "role_invoked",
  })
}
