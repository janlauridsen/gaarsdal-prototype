import type { LogEvent } from "../kernel/types"
import {
  appendLogToRedis,
  readLogsFromRedis,
  redisEnabled,
  appendInteractionToRedis,
  readInteractionsFromRedis,
} from "./redisStore"

export type InteractionEvent = {
  conversation_id: string
  revision: number
  active_node: string
  input_type: string
  user_input?: string
  ai_response?: string
  outcome_node?: string
  timestamp: string
}

const MEMORY_LOG: LogEvent[] = []
const MEMORY_INTERACTIONS: InteractionEvent[] = []

export async function appendLog(event: LogEvent): Promise<void> {
  MEMORY_LOG.push(event)

  if (redisEnabled()) {
    await appendLogToRedis(event)
  }
}

export async function appendInteraction(
  event: InteractionEvent
): Promise<void> {
  MEMORY_INTERACTIONS.push(event)

  if (redisEnabled()) {
    await appendInteractionToRedis(event)
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

export async function readInteractions(
  conversation_id?: string
): Promise<InteractionEvent[]> {
  if (redisEnabled()) {
    return readInteractionsFromRedis(conversation_id)
  }

  if (!conversation_id) return [...MEMORY_INTERACTIONS]
  return MEMORY_INTERACTIONS.filter(
    (e) => e.conversation_id === conversation_id
  )
}
