/**
 * RMRC Smoke Test — Logging Only
 * --------------------------------
 * This script verifies that:
 * - logging.contract.ts
 * - logging.writer.ts
 * - a LogSink
 *
 * work end-to-end.
 *
 * No RMRC logic.
 * No roles.
 * No prompts.
 * No interpretation.
 */

import { RMRCLogger } from "../lib/logging/logging.writer"
import { ConsoleLogSink } from "../lib/logging/dev.console.sink"

import {
  SessionLog,
  TurnLog,
  RoleEventLog,
  LayerEventLog,
} from "../lib/logging/logging.contract"

async function runSmokeSession() {
  const logger = new RMRCLogger(new ConsoleLogSink())

  const sessionId = "smoke-session-001"

  /* ---------------------------
   * Session start
   * --------------------------- */

  const sessionStart: SessionLog = {
    sessionId,
    startedAt: new Date().toISOString(),
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.3",
  }

  await logger.logSession(sessionStart)

  /* ---------------------------
   * Turn 1
   * --------------------------- */

  const turn1: TurnLog = {
    sessionId,
    turnIndex: 1,
    userInputPresent: true,
    systemOutputEmitted: true,
    stopTriggered: false,
  }

  await logger.logTurn(turn1)

  const roleEvent1: RoleEventLog = {
    sessionId,
    turnIndex: 1,
    roleId: "spejler",
    activated: true,
    producedOutput: true,
  }

  await logger.logRoleEvent(roleEvent1)

  const layerEvent1: LayerEventLog = {
    sessionId,
    turnIndex: 1,
    layer: "consolidation",
    event: "merged_1_role_output",
  }

  await logger.logLayerEvent(layerEvent1)

  /* ---------------------------
   * Turn 2
   * --------------------------- */

  const turn2: TurnLog = {
    sessionId,
    turnIndex: 2,
    userInputPresent: false,
    systemOutputEmitted: false,
    stopTriggered: true,
  }

  await logger.logTurn(turn2)

  const layerEvent2: LayerEventLog = {
    sessionId,
    turnIndex: 2,
    layer: "linting",
    event: "output_suppressed_no_user_input",
  }

  await logger.logLayerEvent(layerEvent2)

  /* ---------------------------
   * Session end
   * --------------------------- */

  const sessionEnd: SessionLog = {
    sessionId,
    startedAt: sessionStart.startedAt,
    endedAt: new Date().toISOString(),
    runtimeProfile: "minimal",
    configVersion: "v2.0.2-build-0.3",
    stopReason: "user_exit",
  }

  await logger.logSession(sessionEnd)

  console.log("✔ RMRC smoke session completed")
}

runSmokeSession().catch(err => {
  console.error("✖ Smoke session failed", err)
})
