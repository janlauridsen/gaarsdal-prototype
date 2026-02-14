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
const KEY_CONVO_PREFIX = "gaarsdal:telemetry:turns:c:"

const MAX_TURNS_PER_LIST = 2000

function userKeyList(userKey: string): string {
  return `${KEY_USER_PREFIX}${userKey}`
}

function convoKeyList(conversationId: string): string {
  return `${KEY_CONVO_PREFIX}${conversationId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function appendTelemetryTurn(record: Omit<TelemetryTurnRecord, "ts">): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const full: TelemetryTurnRecord = { ts: nowIso(), ...record }
  const payload = JSON.stringify(full)

  await client.rpush(KEY_ALL, payload)
  await client.rpush(userKeyList(record.user_key), payload)
  await client.rpush(convoKeyList(record.conversation_id), payload)

  await client.ltrim(KEY_ALL, -MAX_TURNS_PER_LIST, -1)
  await client.ltrim(userKeyList(record.user_key), -MAX_TURNS_PER_LIST, -1)
  await client.ltrim(convoKeyList(record.conversation_id), -MAX_TURNS_PER_LIST, -1)
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
  const key = params.conversationId
    ? convoKeyList(params.conversationId)
    : params.userKey
      ? userKeyList(params.userKey)
      : KEY_ALL

  const items = await client.lrange<unknown>(key, -limit, -1)
  return items.map((i) => parseStored<TelemetryTurnRecord>(i)).filter((x): x is TelemetryTurnRecord => Boolean(x))
}
