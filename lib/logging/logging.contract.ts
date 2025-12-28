/**
 * RMRC Logging Contract
 * ---------------------
 * Authoritative, immutable schema for all logging in RMRC.
 *
 * This file defines WHAT can be logged.
 * It does NOT define how logs are written, stored, or read.
 *
 * Any change to this file constitutes an architectural change
 * and requires an explicit commitpoint.
 */

/* ----------------------------------
 * Global Identifiers
 * ---------------------------------- */

export type SessionId = string
export type TurnIndex = number
export type ISOTimeString = string

/* ----------------------------------
 * System / Configuration Context
 * ---------------------------------- */

export type RuntimeProfile =
  | "minimal"
  | "extended"
  | "experimental"

export type ConfigVersion = string

/* ----------------------------------
 * Session-Level Logging
 * ---------------------------------- */

export type SessionLog = {
  sessionId: SessionId
  startedAt: ISOTimeString
  endedAt?: ISOTimeString

  runtimeProfile: RuntimeProfile
  configVersion: ConfigVersion

  stopReason?: SessionStopReason
}

export type SessionStopReason =
  | "user_exit"
  | "max_turns"
  | "linting_block"
  | "relational_legitimacy"
  | "system_abort"

/* ----------------------------------
 * Turn-Level Logging
 * ---------------------------------- */

export type TurnLog = {
  sessionId: SessionId
  turnIndex: TurnIndex

  userInputPresent: boolean
  systemOutputEmitted: boolean

  stopTriggered: boolean
}

/* ----------------------------------
 * Role-Level Events (metadata only)
 * ---------------------------------- */

export type RoleId = string

export type RoleEventLog = {
  sessionId: SessionId
  turnIndex: TurnIndex

  roleId: RoleId

  activated: boolean
  producedOutput: boolean
}

/* ----------------------------------
 * Layer-Level Events
 * ---------------------------------- */

export type LayerId =
  | "consolidation"
  | "linting"
  | "relational_legitimacy"

export type LayerEventLog = {
  sessionId: SessionId
  turnIndex: TurnIndex

  layer: LayerId

  /**
   * Short, structural description of what happened.
   * Must not contain interpretation or evaluation.
   *
   * Examples:
   * - "merged_2_role_outputs"
   * - "blocked_forbidden_action"
   * - "signal_detected_authority_attribution"
   */
  event: string
}

/* ----------------------------------
 * Union Types (Optional Convenience)
 * ---------------------------------- */

export type RMRCLogEntry =
  | SessionLog
  | TurnLog
  | RoleEventLog
  | LayerEventLog
