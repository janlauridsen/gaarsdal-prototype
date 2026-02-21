import type { ConversationState } from "../kernel/types"
import { getRedisClient } from "./redis"

const STATE_KEY_PREFIX = "gaarsdal:state:"

function key(conversationId: string): string {
  return `${STATE_KEY_PREFIX}${conversationId}`
}

function isConversationState(value: unknown): value is ConversationState {
  if (typeof value !== "object" || value === null) return false
  const v = value as any

  return (
    typeof v.conversation_id === "string" &&
    typeof v.revision === "number" &&
    typeof v.active_node === "string" &&
    typeof v.active_node_message === "string" &&
    Array.isArray(v.allowed_transitions) &&
    typeof v.meta === "object" &&
    v.meta !== null &&
    typeof v.status === "string" &&
    Array.isArray(v.parentese_stack)
  )
}

function parseState(raw: unknown): ConversationState | null {
  // Upstash may return either string (raw JSON) or a parsed object.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return isConversationState(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  if (isConversationState(raw)) return raw
  return null
}

export async function readConversationState(
  conversationId: string
): Promise<ConversationState | null> {
  const client = getRedisClient()
  if (!client) return null

  const raw = await client.get<unknown>(key(conversationId))
  return parseState(raw)
}

export async function writeConversationState(
  state: ConversationState,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  // Store as JSON string (works regardless of Upstash return mode)
  await client.set(key(state.conversation_id), JSON.stringify(state), {
    ex: ttlSeconds,
  })
}

export async function deleteConversationState(
  conversationId: string
): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(key(conversationId))
}
