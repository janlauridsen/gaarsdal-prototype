import { RMRCLogger } from "../logging/logging.writer"
import { RedisLogSink } from "../logging/redis.log.sink"
import {
  SessionLog,
  TurnLog,
  LayerEventLog,
} from "../logging/logging.contract"
import { runMetaObserverRole } from "../roles/meta.observer.role"

/**
 * RMRC Session Skeleton
 * --------------------
 * Purpose:
 * - Verify session lifecycle logging
 * - Verify turn progression
 * - Verify deterministic role invocation
 * - Verify meta-observer logging
 *
 * No AI
 * No consolidation
 * No role output
 */
export async function runRMRCSessionSkeleton(sessionId: string) {
  const logger = new RMRCLogger(new RedisLogSink())
  const startedAt = new Date().toISOString()

  /* ──────────────────────────────
     SESSION START
  ────────────────────────────── */

  const sessionStart: SessionLog = {
    sessionId,
    startedAt,
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.3",
  }

  await logger.logSession(sessionStart)

  /* ──────────────────────────────
     TURN 1
  ────────────────────────────── */

  const turn1: TurnLog = {
    sessionId,
    turnIndex: 1,
    userInputPresent: true,
    systemOutputEmitted: false,
    stopTriggered: false,
  }

  await logger.logTurn(turn1)

  /* ──────────────────────────────
     ROLE INVOCATION (ORDERED)
  ────────────────────────────── */

  const mirrorInvoked: LayerEventLog = {
    sessionId,
    turnIndex: 1,
    layer: "relational_legitimacy",
    event: "role_invoked:mirror",
  }

  await logger.logLayerEvent(mirrorInvoked)

  const boundaryInvoked: LayerEventLog = {
    sessionId,
    turnIndex: 1,
    layer: "relational_legitimacy",
    event: "role_invoked:boundary",
  }

  await logger.logLayerEvent(boundaryInvoked)

  /* ──────────────────────────────
     META OBSERVER (LOGGING ONLY)
  ────────────────────────────── */

  await runMetaObserverRole(logger, {
    sessionId,
    turnIndex: 1,
  })

  /* ──────────────────────────────
     TURN 2 (STOP)
  ────────────────────────────── */

  const turn2: TurnLog = {
    sessionId,
    turnIndex: 2,
    userInputPresent: false,
    systemOutputEmitted: false,
    stopTriggered: true,
  }

  await logger.logTurn(turn2)

  /* ──────────────────────────────
     SESSION END
  ────────────────────────────── */

  const sessionEnd: SessionLog = {
    sessionId,
    startedAt,
    endedAt: new Date().toISOString(),
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.3",
    stopReason: "max_turns",
  }

  await logger.logSession(sessionEnd)
}
