import { getRedisClient } from "../persistence/redis"
import type { ConversationEventV1, EventStoreReadParams } from "./types"

const KEY_ALL = "gaarsdal:events:v1:all"
const KEY_USER_PREFIX = "gaarsdal:events:v1:u:"
const KEY_CONVO_PREFIX = "gaarsdal:events:v1:c:"

// Keep bounded in Redis for V1. Long-term storage can be introduced later.
const MAX_EVENTS_PER_LIST = 4000

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyList(conversationId: string): string {
  return `${KEY_CONVO_PREFIX}${conversationId}`
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

export async function appendConversationEventV1(event: ConversationEventV1): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const payload = JSON.stringify(event)

  await client.rpush(KEY_ALL, payload)
  await client.rpush(userKeyList(event.user_key), payload)
  await client.rpush(convoKeyList(event.conversation_id), payload)

  await client.ltrim(KEY_ALL, -MAX_EVENTS_PER_LIST, -1)
  await client.ltrim(userKeyList(event.user_key), -MAX_EVENTS_PER_LIST, -1)
  await client.ltrim(convoKeyList(event.conversation_id), -MAX_EVENTS_PER_LIST, -1)
}

export async function readConversationEventsV1(params: EventStoreReadParams): Promise<ConversationEventV1[]> {
  const client = getRedisClient()
  if (!client) return []

  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 100

  const key = params.conversationId
    ? convoKeyList(params.conversationId)
    : params.userKey
      ? userKeyList(params.userKey)
      : KEY_ALL

  const items = await client.lrange<unknown>(key, -limit, -1)
  return items
    .map((i) => parseStored<ConversationEventV1>(i))
    .filter((x): x is ConversationEventV1 => Boolean(x))
}
