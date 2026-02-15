import { getRedisClient } from "../persistence/redis"

export type SpineInputType = "SYSTEM_INIT" | "FREE_TEXT" | "EXPLICIT_TRANSITION" | "SYSTEM" | "INTERNAL_TICK"

export type SpineError = {
  code: string
  message: string
  retryable?: boolean
}

/**
 * Minimal v23 spine event. Intentionally small and avoids raw user text in production.
 * Schema is append-only and used for replay/debug and async triggers.
 */
export type SpineEventV23 = {
  schema_version: "v23"
  event_id: string
  ts: string // ISO timestamp

  user_key: string
  conversation_id: string

  revision_before: number
  revision_after: number
  node_before: string | null
  node_after: string
  status_after: string

  input_type: SpineInputType
  transition_type: string

  meta_domains_written?: string[]
  meta_keys_written?: string[]

  latency_ms?: number
  error?: SpineError
}

const KEY_ALL = "gaarsdal:spine:v23:events:all"
const KEY_USER_PREFIX = "gaarsdal:spine:v23:events:u:"
const KEY_CONVO_PREFIX = "gaarsdal:spine:v23:events:c:"

const MAX_EVENTS_PER_LIST = 4000

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyList(conversationId: string): string {
  return `${KEY_CONVO_PREFIX}${conversationId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function appendSpineEventV23(event: Omit<SpineEventV23, "ts">): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const full: SpineEventV23 = { ts: nowIso(), ...event }
  const payload = JSON.stringify(full)

  await client.rpush(KEY_ALL, payload)
  await client.rpush(userKeyList(event.user_key), payload)
  await client.rpush(convoKeyList(event.conversation_id), payload)

  await client.ltrim(KEY_ALL, -MAX_EVENTS_PER_LIST, -1)
  await client.ltrim(userKeyList(event.user_key), -MAX_EVENTS_PER_LIST, -1)
  await client.ltrim(convoKeyList(event.conversation_id), -MAX_EVENTS_PER_LIST, -1)
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

export async function readSpineEventsV23(params: {
  userKey?: string
  conversationId?: string
  limit?: number
}): Promise<SpineEventV23[]> {
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
    .map((i) => parseStored<SpineEventV23>(i))
    .filter((x): x is SpineEventV23 => Boolean(x))
}
