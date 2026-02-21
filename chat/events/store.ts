// chat/events/store.ts
import { getRedisClient } from "../persistence/redis"
import type { ConversationEventV1, EventStoreReadParams } from "./types"

const KEY_ALL = "gaarsdal:events:v1:all"
const KEY_USER_PREFIX = "gaarsdal:events:v1:u:"
// Canonical per-conversation stream.
// Uses a dedicated segment ("conv") to avoid ambiguity with conversation ids like "c:<uuid>".
// New canonical key: gaarsdal:events:v1:conv:{conversation_id}
const KEY_CONVO_PREFIX_CANONICAL = "gaarsdal:events:v1:conv:" // + {conversation_id}

// Legacy variants that existed prior to the "conv" namespace:
//  - gaarsdal:events:v1:{conversation_id}
//  - gaarsdal:events:v1:c:{conversation_id} (and sometimes conversation_id already started with "c:")
const KEY_CONVO_PREFIX_OLD_CANONICAL = "gaarsdal:events:v1:" // + {conversation_id}
const KEY_CONVO_PREFIX_LEGACY = "gaarsdal:events:v1:c:" // legacy rollout

// Conversation index for session browsing (new default)
const INDEX_RECENT_CONVERSATIONS = "gaarsdal:index:conversations:recent" // ZSET {conversation_id} score=timestamp_ms
const INDEX_MAX_ITEMS = 5000
const INDEX_TTL_SECONDS = 7776000 // 90 days

// Keep bounded in Redis for V1. Long-term storage can be introduced later.
const MAX_EVENTS_PER_LIST = 4000

/**
 * IMPORTANT:
 * Dual-write to legacy keys will recreate duplication (including c:c:...),
 * so it is OFF by default. Enable only for short migration windows.
 */
const DUAL_WRITE_LEGACY = false

// Default: ONLY per-conversation is written. Global/user streams can be re-enabled temporarily.
const WRITE_GLOBAL = process.env.GAARSDAL_EVENTS_V1_WRITE_GLOBAL === "1"
const WRITE_USER = process.env.GAARSDAL_EVENTS_V1_WRITE_USER === "1"

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyCanonical(conversationId: string): string {
  return `${KEY_CONVO_PREFIX_CANONICAL}${conversationId}`
}

function convoKeyOldCanonical(conversationId: string): string {
  return `${KEY_CONVO_PREFIX_OLD_CANONICAL}${conversationId}`
}

// Some old data was written as gaarsdal:events:v1:c:{conversationId}
// where conversationId might already start with "c:" -> creates c:c:...
// We therefore support BOTH legacy variants on read.
function stripLeadingConversationPrefix(conversationId: string): string {
  return conversationId.startsWith("c:") ? conversationId.slice(2) : conversationId
}

function convoKeyLegacyVariants(conversationId: string): string[] {
  const keys = new Set<string>()

  // Previous canonical (before "conv:")
  keys.add(convoKeyOldCanonical(conversationId))

  // Legacy rollout variants
  keys.add(`${KEY_CONVO_PREFIX_LEGACY}${conversationId}`)
  keys.add(`${KEY_CONVO_PREFIX_LEGACY}${stripLeadingConversationPrefix(conversationId)}`)

  // Remove any accidental canonical collision
  keys.delete(convoKeyCanonical(conversationId))

  return [...keys]
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

async function touchConversationIndex(client: any, conversationId: string, timestampMs: number): Promise<void> {
  // Upstash client types have evolved; use `any` calls to keep compatibility across versions.
  try {
    const anyClient = client as any
    // Try common zadd signatures.
    try {
      await anyClient.zadd(INDEX_RECENT_CONVERSATIONS, { score: timestampMs, member: conversationId })
    } catch {
      try {
        await anyClient.zadd(INDEX_RECENT_CONVERSATIONS, [{ score: timestampMs, member: conversationId }])
      } catch {
        await anyClient.zadd(INDEX_RECENT_CONVERSATIONS, timestampMs, conversationId)
      }
    }
    // Keep most recent N
    await anyClient.zremrangebyrank(INDEX_RECENT_CONVERSATIONS, 0, -INDEX_MAX_ITEMS - 1)
    await anyClient.expire(INDEX_RECENT_CONVERSATIONS, INDEX_TTL_SECONDS)
  } catch {
    // Index is best-effort. Event append should not fail if index update fails.
  }
}

/**
 * Backwards-compatible signature (pages/api/chat.ts expects 1 argument).
 */
export async function appendConversationEventV1(event: ConversationEventV1): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const payload = JSON.stringify(event)

  // Keep a lightweight index so the Sessions UI does not depend on global/user event lists.
  await touchConversationIndex(client, event.conversation_id, event.timestamp_ms)

  // Optional global + per-user (OFF by default)
  if (WRITE_GLOBAL) {
    await rpushAndTrim(client, KEY_ALL, payload)
  }
  if (WRITE_USER) {
    await rpushAndTrim(client, userKeyList(event.user_key), payload)
  }

  // Canonical per-conversation (the only one we want going forward)
  const keyCanonical = convoKeyCanonical(event.conversation_id)
  await rpushAndTrim(client, keyCanonical, payload)

  // Optional dual-write to legacy (OFF by default)
  if (DUAL_WRITE_LEGACY) {
    for (const legacyKey of convoKeyLegacyVariants(event.conversation_id)) {
      await rpushAndTrim(client, legacyKey, payload)
    }
  }
}

async function readListTail(client: any, key: string, limit: number): Promise<ConversationEventV1[]> {
  const items = (await client.lrange(key, -limit, -1)) as unknown[]
  return items
    .map((i) => parseStored<ConversationEventV1>(i))
    .filter((x): x is ConversationEventV1 => Boolean(x))
}

export async function readConversationEventsV1(params: EventStoreReadParams): Promise<ConversationEventV1[]> {
  const client = getRedisClient()
  if (!client) return []

  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 100

  // Conversation-specific read: canonical first, then legacy variants
  if (params.conversationId) {
    const keyCanonical = convoKeyCanonical(params.conversationId)
    const primary = await readListTail(client, keyCanonical, limit)
    if (primary.length > 0) return primary

    // Fallback to any older key variants (best-effort)
    for (const legacyKey of convoKeyLegacyVariants(params.conversationId)) {
      const fallback = await readListTail(client, legacyKey, limit)
      if (fallback.length > 0) return fallback
    }

    return []
  }

  // User-scoped read
  if (params.userKey) {
    return await readListTail(client, userKeyList(params.userKey), limit)
  }

  // Global
  return await readListTail(client, KEY_ALL, limit)
}

/**
 * Alias for compatibility with code that imports `readConversationEvents`.
 * (Your build error suggested this name exists elsewhere.)
 */
export const readConversationEvents = readConversationEventsV1
