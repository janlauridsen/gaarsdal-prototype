import type { ConversationState } from "../kernel/types"
import { getRedisClient } from "./redis"

const STATE_KEY_PREFIX = "gaarsdal:state:"

function key(conversationId: string): string {
  return `${STATE_KEY_PREFIX}${conversationId}`
}

function parseState(raw: unknown): ConversationState | null {
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw) as ConversationState
  } catch {
    return null
  }
}

export async function readConversationState(conversationId: string): Promise<ConversationState | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(key(conversationId))
  return parseState(raw)
}

export async function writeConversationState(state: ConversationState, ttlSeconds: number): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(key(state.conversation_id), JSON.stringify(state), { ex: ttlSeconds })
}

export async function deleteConversationState(conversationId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(key(conversationId))
}
