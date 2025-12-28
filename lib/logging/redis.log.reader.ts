/**
 * Redis-backed log reader.
 *
 * Implements LogReader exactly as specified.
 * Uses shared Redis client from lib/redis.ts.
 */

import { redis } from "../redis"
import { RMRCLogEntry, SessionId } from "./logging.contract"
import { LogReader } from "./logging.reader"

export class RedisLogReader implements LogReader {
  async getSessionLogs(sessionId: SessionId): Promise<RMRCLogEntry[]> {
    const key = `rmrc:session:${sessionId}`
    const entries = await redis.lrange(key, 0, -1)

    if (!entries) return []

    return entries.map((raw) =>
      typeof raw === "string" ? JSON.parse(raw) : raw
    )
  }
}
