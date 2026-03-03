import { getRedisClient } from "../persistence/redis"

export type SpineInputType = "SYSTEM_INIT" | "FREE_TEXT" | "EXPLICIT_TRANSITION" | "UI_ACTION" | "SYSTEM" | "INTERNAL_TICK"

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
// Canonical: suffix is the raw conversation_id (e.g. "c:..." or "lobby:u:...")
// This avoids the noisy "c:c:..." keys.
const KEY_CONVO_PREFIX_CANONICAL = "gaarsdal:spine:v23:events:"
// Legacy rollout prefix kept for backwards-compatible reads.
const KEY_CONVO_PREFIX_LEGACY = "gaarsdal:spine:v23:events:c:"

const MAX_EVENTS_PER_LIST = 4000

/**
 * Spine is intended for observability / operational triggering, not canonical audit.
 * To reduce duplication, default behaviour is to write only per-conversation.
 *
 * Enable additional materialized views via env flags:
 *   - GAARSDAL_SPINE_WRITE_ALL=1
 *   - GAARSDAL_SPINE_WRITE_USER=1
 */
function envTruthy(v: string | undefined): boolean {
  if (!v) return false
  const x = v.trim().toLowerCase()
  return x === "1" || x === "true" || x === "yes" || x === "y" || x === "on"
}

const WRITE_ALL = envTruthy(process.env.GAARSDAL_SPINE_WRITE_ALL)
const WRITE_USER = envTruthy(process.env.GAARSDAL_SPINE_WRITE_USER)

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyCanonical(conversationId: string): string {
  return `${KEY_CONVO_PREFIX_CANONICAL}${conversationId}`
}

function stripLeadingConversationPrefix(conversationId: string): string {
  return conversationId.startsWith("c:") ? conversationId.slice(2) : conversationId
}

function convoKeyLegacyVariants(conversationId: string): string[] {
  const a = `${KEY_CONVO_PREFIX_LEGACY}${conversationId}`
  const b = `${KEY_CONVO_PREFIX_LEGACY}${stripLeadingConversationPrefix(conversationId)}`
  return a === b ? [a] : [a, b]
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function appendSpineEventV23(event: Omit<SpineEventV23, "ts">): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const full: SpineEventV23 = { ts: nowIso(), ...event }
  const payload = JSON.stringify(full)

  // Default: per-conversation only.
  const keys: string[] = [convoKeyCanonical(event.conversation_id)]
  if (WRITE_ALL) keys.push(KEY_ALL)
  if (WRITE_USER) keys.push(userKeyList(event.user_key))

  // Keep the write path simple and predictable. If you need stronger atomicity,
  // consider batching via pipeline or a Lua script.
  for (const k of keys) {
    await client.rpush(k, payload)
    await client.ltrim(k, -MAX_EVENTS_PER_LIST, -1)
  }
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
  // Conversation-specific read: canonical first, then legacy variants.
  if (params.conversationId) {
    const keyCanonical = convoKeyCanonical(params.conversationId)
    const items = await client.lrange<unknown>(keyCanonical, -limit, -1)
    const parsed = items.map((i) => parseStored<SpineEventV23>(i)).filter((x): x is SpineEventV23 => Boolean(x))
    if (parsed.length > 0) return parsed

    for (const legacyKey of convoKeyLegacyVariants(params.conversationId)) {
      if (legacyKey === keyCanonical) continue
      const legacyItems = await client.lrange<unknown>(legacyKey, -limit, -1)
      const legacyParsed = legacyItems
        .map((i) => parseStored<SpineEventV23>(i))
        .filter((x): x is SpineEventV23 => Boolean(x))
      if (legacyParsed.length > 0) return legacyParsed
    }
    return []
  }

  const key = params.userKey ? userKeyList(params.userKey) : KEY_ALL
  const items = await client.lrange<unknown>(key, -limit, -1)
  return items.map((i) => parseStored<SpineEventV23>(i)).filter((x): x is SpineEventV23 => Boolean(x))
}
