import { RMRCLogger } from "../logging/logging.writer"
import { RedisLogSink } from "../logging/redis.log.sink"
import {
  SessionLog,
  TurnLog,
  LayerEventLog,
} from "../logging/logging.contract"
import { runMetaObserverRole } from "../roles/meta.observer.role"
import { runMirrorAIRole } from "../roles/mirror.ai.role"

/**
 * RMRC Session Skeleton
 * --------------------
 * Purpose:
 * - Verify session lifecycle logging
 * - Verify role orchestration
 * - Verify minimal AI role execution
 *
 * Controlled AI usage
 */
export async function runRMRCSessionSkeleton(sessionId: string) {
  const logger = new RMRCLogger(new RedisLogSink())
  const startedAt = new Date().toISOString()

  /* SESSION START */
  await logger.logSession({
    sessionId,
    startedAt,
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.5",
  })

  /* TURN 1 */
  await logger.logTurn({
    sessionId,
    turnIndex: 1,
    userInputPresent: true,
    systemOutputEmitted: true,
    stopTriggered: false,
  })

  /* AI ROLE */
  const mirroredText = await runMirrorAIRole(logger, {
    sessionId,
    turnIndex: 1,
    userInput: "Jeg oplever uro, når jeg skal præstere.",
  })

  /* OUTPUT EMITTED (STRUCTURAL ONLY) */
  const outputEvent: LayerEventLog = {
    sessionId,
    turnIndex: 1,
    layer: "relational_legitimacy",
    event: "system_output_emitted",
  }

  await logger.logLayerEvent(outputEvent)

  /* META OBSERVER */
  await runMetaObserverRole(logger, {
    sessionId,
    turnIndex: 1,
  })

  /* TURN 2 (STOP) */
  await logger.logTurn({
    sessionId,
    turnIndex: 2,
    userInputPresent: false,
    systemOutputEmitted: false,
    stopTriggered: true,
  })

  /* SESSION END */
  await logger.logSession({
    sessionId,
    startedAt,
    endedAt: new Date().toISOString(),
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.5",
    stopReason: "max_turns",
  })

  // NOTE: mirroredText intentionally unused here
  // This is a structural test, not a UI flow.
}
