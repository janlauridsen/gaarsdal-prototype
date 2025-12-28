/**
 * Boundary Role (Stub)
 * -------------------
 * Structural placeholder for the "Afgrænser" role.
 *
 * Purpose:
 * - Represents boundary awareness / containment
 *
 * Constraints:
 * - No AI
 * - No interpretation
 * - No enforcement
 * - Logs invocation only
 */

import { RMRCLogger } from "../logging/logging.writer"

type BoundaryRoleParams = {
  sessionId: string
  turnIndex: number
}

export async function runBoundaryRole(
  logger: RMRCLogger,
  params: BoundaryRoleParams
): Promise<void> {
  await logger.logLayerEvent({
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "role_invoked",
  })
}
