/**
 * Epistemic Witness Logging
 * ------------------------
 * This module logs an epistemic snapshot as a structural
 * layer event, in strict accordance with logging.contract.ts.
 *
 * No custom event types.
 * No semantic interpretation.
 */

import { RMRCLogger } from "./logging.writer"
import { LayerEventLog } from "./logging.contract"

type EpistemicWitnessParams = {
  sessionId: string
  turnIndex: number
  description: string
  openGaps?: string[]
}

export async function logEpistemicWitness(
  logger: RMRCLogger,
  params: EpistemicWitnessParams
): Promise<void> {
  const event: LayerEventLog = {
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "epistemic_snapshot_recorded",
  }

  await logger.logLayerEvent(event)
}
