import { getRedisClient } from "../persistence/redis"
import type { ConversationEventV1, EventStoreReadParams } from "./types"

const KEY_ALL = "gaarsdal:events:v1:all"
const KEY_USER_PREFIX = "gaarsdal:events:v1:u:"

// New canonical per-conversation key: gaarsdal:events:v1:{conversation_id}
const KEY_CONVO_PREFIX_NEW = "gaarsdal:events:v1:"

// Legacy key from V1 initial rollout (kept for migration): gaarsdal:events:v1:c:{conversation_id}
const KEY_CONVO_PREFIX_LEGACY = "gaarsdal:events:v1:c:"

// Keep bounded in Redis for V1. Long-term storage can be introduced later.
const MAX_EVENTS_PER_LIST = 4000

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyListNew(conversationId: string): string {
  return `${KEY_CONVO_PREFIX_NEW}${conversationId}`
}

function convoKeyListLegacy(conversationId: string): string {
  return `${KEY_CONVO_PREFIX_LEGACY}${conversationId}`
}

function parseStored<T>(x: unknown): T | null {
  try {
    if (typeof x === "string") return JSON.parse(x) as T
    if (typeof x === "object" && x !== null) return x as T
    return null
  } catch {
    return null
  }
}

async function rpushAndTrim(client: any, key: string, payload: string): Promise<void> {
  await client.rpush(key, payload)
  await client.ltrim(key, -MAX_EVENTS_PER_LIST, -1)
}

export async function appendConversationEventV1(event: ConversationEventV1): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const payload = JSON.stringify(event)

  // Global + per-user (stable)
  await rpushAndTrim(client, KEY_ALL, payload)
  await rpushAndTrim(client, userKeyList(event.user_key), payload)

  // Per-conversation (dual write for migration safety)
  const keyNew = convoKeyListNew(event.conversation_id)
  const keyLegacy = convoKeyListLegacy(event.conversation_id)

  await rpushAndTrim(client, keyNew, payload)

  // Only dual-write if different (it will be different for conversation_ids like "c:..." and "lobby:u:...")
  if (keyLegacy !== keyNew) {
    await rpushAndTrim(client, keyLegacy, payload)
  }
}

async function readListTail(client: any, key: string, limit: number): Promise<ConversationEventV1[]> {
  const items = await client.lrange<unknown>(key, -limit, -1)
  return items
    .map((i) => parseStored<ConversationEventV1>(i))
    .filter((x): x is ConversationEventV1 => Boolean(x))
}

export async function readConversationEventsV1(params: EventStoreReadParams): Promise<ConversationEventV1[]> {
  const client = getRedisClient()
  if (!client) return []

  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 100

  // Conversation-specific read: try new key first, fallback to legacy if empty.
  if (params.conversationId) {
    const keyNew = convoKeyListNew(params.conversationId)
    const keyLegacy = convoKeyListLegacy(params.conversationId)

    const primary = await readListTail(client, keyNew, limit)
    if (primary.length > 0) return primary

    if (keyLegacy !== keyNew) {
      const fallback = await readListTail(client, keyLegacy, limit)
      return fallback
    }
    return primary
  }

  // User-scoped read
  if (params.userKey) {
    return readListTail(client, userKeyList(params.userKey), limit)
  }

  // Global
  return readListTail(client, KEY_ALL, limit)
}
