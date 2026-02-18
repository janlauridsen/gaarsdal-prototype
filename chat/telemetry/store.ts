import { getRedisClient } from "../persistence/redis"

export type TelemetryTurnRecord = {
  ts: string
  conversation_id: string
  user_key: string
  revision: number
  node_id: string
  input_type: string
  user_input_raw?: string
  assistant_output_raw?: string
  transition_type?: string
  outcome_node?: string
  capability_id?: string | null
  meta_keys_written?: string[]
}

const KEY_ALL = "gaarsdal:telemetry:turns:all"
const KEY_USER_PREFIX = "gaarsdal:telemetry:turns:u:"
// Canonical: suffix is the raw conversation_id (e.g. "c:..." or "lobby:u:...")
// This avoids the noisy "c:c:..." keys.
const KEY_CONVO_PREFIX_CANONICAL = "gaarsdal:telemetry:turns:"
// Legacy rollout prefix kept for backwards-compatible reads.
const KEY_CONVO_PREFIX_LEGACY = "gaarsdal:telemetry:turns:c:"

const MAX_TURNS_PER_LIST = 2000

/**
 * Telemetry is operational data. To reduce duplication, default behaviour is to write only per-conversation.
 * Enable additional materialized views via env flags:
 *   - GAARSDAL_TELEMETRY_WRITE_ALL=1
 *   - GAARSDAL_TELEMETRY_WRITE_USER=1
 */
function envTruthy(v: string | undefined): boolean {
  if (!v) return false
  const x = v.trim().toLowerCase()
  return x === "1" || x === "true" || x === "yes" || x === "y" || x === "on"
}

const WRITE_ALL = envTruthy(process.env.GAARSDAL_TELEMETRY_WRITE_ALL)
const WRITE_USER = envTruthy(process.env.GAARSDAL_TELEMETRY_WRITE_USER)

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

export async function appendTelemetryTurn(record: Omit<TelemetryTurnRecord, "ts">): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const full: TelemetryTurnRecord = { ts: nowIso(), ...record }
  const payload = JSON.stringify(full)

  // Default: per-conversation only.
  const keys: string[] = [convoKeyCanonical(record.conversation_id)]
  if (WRITE_ALL) keys.push(KEY_ALL)
  if (WRITE_USER) keys.push(userKeyList(record.user_key))

  for (const k of keys) {
    await client.rpush(k, payload)
    await client.ltrim(k, -MAX_TURNS_PER_LIST, -1)
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

export async function readTelemetryTurns(params: {
  userKey?: string
  conversationId?: string
  limit?: number
}): Promise<TelemetryTurnRecord[]> {
  const client = getRedisClient()
  if (!client) return []

  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 100
  // Conversation-specific read: canonical first, then legacy variants.
  if (params.conversationId) {
    const keyCanonical = convoKeyCanonical(params.conversationId)
    const items = await client.lrange<unknown>(keyCanonical, -limit, -1)
    const parsed = items
      .map((i) => parseStored<TelemetryTurnRecord>(i))
      .filter((x): x is TelemetryTurnRecord => Boolean(x))
    if (parsed.length > 0) return parsed

    for (const legacyKey of convoKeyLegacyVariants(params.conversationId)) {
      if (legacyKey === keyCanonical) continue
      const legacyItems = await client.lrange<unknown>(legacyKey, -limit, -1)
      const legacyParsed = legacyItems
        .map((i) => parseStored<TelemetryTurnRecord>(i))
        .filter((x): x is TelemetryTurnRecord => Boolean(x))
      if (legacyParsed.length > 0) return legacyParsed
    }
    return []
  }

  const key = params.userKey ? userKeyList(params.userKey) : KEY_ALL
  const items = await client.lrange<unknown>(key, -limit, -1)
  return items.map((i) => parseStored<TelemetryTurnRecord>(i)).filter((x): x is TelemetryTurnRecord => Boolean(x))
}
