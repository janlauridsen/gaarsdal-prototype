import type { LogEvent } from "../kernel/types"

const MEMORY_LOG: LogEvent[] = []

export function appendLog(event: LogEvent): void {
  MEMORY_LOG.push(event)
}

export function readLogs(
  conversation_id?: string
): LogEvent[] {
  if (!conversation_id) return [...MEMORY_LOG]
  return MEMORY_LOG.filter(
    (e) => e.conversation_id === conversation_id
  )
}
