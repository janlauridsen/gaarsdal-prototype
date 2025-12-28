/**
 * Mirror Role (Stub)
 * ------------------
 * Structural placeholder for the "Spejler" role.
 *
 * - No AI
 * - No interpretation
 * - No text generation
 * - Logs invocation via an existing runtime layer
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
    layer: "runtime",
    event: "role_invoked",
  })
}
