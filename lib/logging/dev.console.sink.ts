import { LogSink } from "./logging.types"
import { RMRCLogEntry } from "./logging.contract"

export class ConsoleLogSink implements LogSink {
  async write(entry: RMRCLogEntry): Promise<void> {
    console.log("[RMRC LOG]", JSON.stringify(entry, null, 2))
  }
}
