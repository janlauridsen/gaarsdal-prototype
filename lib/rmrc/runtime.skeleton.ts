import { RMRCLogger } from "../logging/logging.writer"
import { RedisLogSink } from "../logging/redis.log.sink"
import {
  SessionLog,
  TurnLog,
  LayerEventLog,
} from "../logging/logging.contract"

export async function runRMRCSessionSkeleton(sessionId: string) {
  const logger = new RMRCLogger(new RedisLogSink())
  const startedAt = new Date().toISOString()

  const sessionStart: SessionLog = {
    sessionId,
    startedAt,
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.3",
  }

  await logger.logSession(sessionStart)

  const turn1: TurnLog = {
    sessionId,
    turnIndex: 1,
    userInputPresent: true,
    systemOutputEmitted: true,
    stopTriggered: false,
  }

  await logger.logTurn(turn1)

  const layerEvent: LayerEventLog = {
    sessionId,
    turnIndex: 1,
    layer: "consolidation",
    event: "runtime_skeleton_no_roles",
  }

  await logger.logLayerEvent(layerEvent)

  const turn2: TurnLog = {
    sessionId,
    turnIndex: 2,
    userInputPresent: false,
    systemOutputEmitted: false,
    stopTriggered: true,
  }

  await logger.logTurn(turn2)

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
