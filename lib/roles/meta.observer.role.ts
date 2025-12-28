import { RMRCLogger } from "../logging/logging.writer"
import { LayerEventLog } from "../logging/logging.contract"

/**
 * Meta Observer Role (Logging Only)
 * --------------------------------
 * Observes that a turn completed without:
 * - system abort
 * - linting block
 * - relational legitimacy stop
 *
 * Does NOT evaluate content.
 * Does NOT inspect role output.
 * Does NOT influence runtime.
 */
export async function runMetaObserverRole(
  logger: RMRCLogger,
  params: {
    sessionId: string
    turnIndex: number
  }
) {
  const metaEvent: LayerEventLog = {
    sessionId: params.sessionId,
    turnIndex: params.turnIndex,
    layer: "relational_legitimacy",
    event: "meta_observer:turn_completed",
  }

  await logger.logLayerEvent(metaEvent)
}
