import { Redis } from "@upstash/redis"
import { RMRCLogEntry, SessionId } from "./logging.contract"
import { LogReader } from "./logging.reader"

const redis = Redis.fromEnv()

export class RedisLogReader implements LogReader {
  async getSessionLogs(sessionId: SessionId): Promise<RMRCLogEntry[]> {
    const key = `rmrc:session:${sessionId}`

    const raw = await redis.lrange(key, 0, -1)
    if (!raw) return []

    return raw.map((item: string) => JSON.parse(item))
  }
}
