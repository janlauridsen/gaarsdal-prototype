/**
 * Redis-backed log sink.
 *
 * Uses the shared Redis client from lib/redis.ts.
 * No direct dependency on @upstash/redis here.
 */

import { redis } from "../redis"
import { LogSink } from "./logging.types"
import { RMRCLogEntry } from "./logging.contract"

export class RedisLogSink implements LogSink {
  async write(entry: RMRCLogEntry): Promise<void> {
    const key = `rmrc:session:${entry.sessionId}`
    await redis.rpush(key, JSON.stringify(entry))
  }
}
