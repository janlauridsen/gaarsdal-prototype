import { RMRCLogEntry, SessionId } from "./logging.contract"

/**
 * Read-only interface for RMRC logs.
 * This module must never write, modify or enrich log data.
 */

export interface LogReader {
  getSessionLogs(sessionId: SessionId): Promise<RMRCLogEntry[]>
}
