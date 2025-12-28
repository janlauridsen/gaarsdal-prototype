import {
  SessionLog,
  TurnLog,
  RoleEventLog,
  LayerEventLog,
  RMRCLogEntry,
} from "./logging.contract"

/**
 * A write-only sink for RMRC logs.
 * Implementation decides where logs go (Redis, file, console, etc.)
 */
export interface LogSink {
  write(entry: RMRCLogEntry): Promise<void>
}

export type {
  SessionLog,
  TurnLog,
  RoleEventLog,
  LayerEventLog,
  RMRCLogEntry,
}
