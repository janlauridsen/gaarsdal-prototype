import type { LogEvent } from "../kernel/types"
import {
  appendLogToRedis,
  readLogsFromRedis,
  redisEnabled,
} from "./redisStore"

const MEMORY_LOG: LogEvent[] = []

export async function appendLog(event: LogEvent): Promise<void> {
  MEMORY_LOG.push(event)

  if (redisEnabled()) {
    await appendLogToRedis(event)
  }
}

export async function readLogs(
  conversation_id?: string
): Promise<LogEvent[]> {
  if (redisEnabled()) {
    return readLogsFromRedis(conversation_id)
  }

  if (!conversation_id) return [...MEMORY_LOG]
  return MEMORY_LOG.filter(
    (e) => e.conversation_id === conversation_id
  )
}
