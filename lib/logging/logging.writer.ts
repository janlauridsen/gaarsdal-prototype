import {
  SessionLog,
  TurnLog,
  RoleEventLog,
  LayerEventLog,
  RMRCLogEntry,
} from "./logging.contract"
import { LogSink } from "./logging.types"

/**
 * RMRC Logging Writer
 * -------------------
 * Write-only, non-intelligent logging facade.
 *
 * This module:
 * - does not inspect data
 * - does not enrich data
 * - does not validate semantics
 *
 * It only forwards entries to the configured sink.
 */

export class RMRCLogger {
  private sink: LogSink

  constructor(sink: LogSink) {
    this.sink = sink
  }

  async logSession(entry: SessionLog): Promise<void> {
    await this.write(entry)
  }

  async logTurn(entry: TurnLog): Promise<void> {
    await this.write(entry)
  }

  async logRoleEvent(entry: RoleEventLog): Promise<void> {
    await this.write(entry)
  }

  async logLayerEvent(entry: LayerEventLog): Promise<void> {
    await this.write(entry)
  }

  private async write(entry: RMRCLogEntry): Promise<void> {
    await this.sink.write(entry)
  }
}
