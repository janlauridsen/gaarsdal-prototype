import { Redis } from "@upstash/redis"
import { LogSink } from "./logging.types"
import { RMRCLogEntry } from "./logging.contract"

const redis = Redis.fromEnv()

/**
 * Append-only Redis sink for RMRC logs
 * Key: rmrc:session:{sessionId}
 */
export class RedisLogSink implements LogSink {
  async write(entry: RMRCLogEntry): Promise<void> {
    const sessionId = (entry as any).sessionId
    if (!sessionId) {
      throw new Error("RMRC log entry missing sessionId")
    }

    const key = `rmrc:session:${sessionId}`
    await redis.rpush(key, JSON.stringify(entry))
  }
}
