import { Redis } from "@upstash/redis"
import type { LogEvent } from "../kernel/types"
import type { InteractionEvent } from "./sink"

const REDIS_ALL_KEY = "gaarsdal:logs:all"
const REDIS_CONVO_PREFIX = "gaarsdal:logs:"
const REDIS_REPLAY_HISTORY_KEY = "gaarsdal:replay:history"

const REDIS_INTERACTIONS_ALL_KEY = "gaarsdal:interactions:all"
const REDIS_INTERACTIONS_CONVO_PREFIX = "gaarsdal:interactions:"

// Keep derived logs bounded to avoid unbounded growth in Redis.
// These are not canonical sources of truth (sessions UI no longer depends on them).
const MAX_LOGS_PER_LIST = 2000
const MAX_INTERACTIONS_PER_LIST = 2000
const DEFAULT_DERIVED_TTL_SECONDS = 7776000 // 90 days

function envInt(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(String(v ?? ""), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const DERIVED_TTL_SECONDS = envInt(process.env.GAARSDAL_DERIVED_TTL_SECONDS, DEFAULT_DERIVED_TTL_SECONDS)

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!redisEnabled()) return null
  if (!redisClient) {
    redisClient = Redis.fromEnv()
  }
  return redisClient
}

export function redisEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

export async function appendLogToRedis(
  event: LogEvent
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const payload = JSON.stringify(event)
  const convoKey = `${REDIS_CONVO_PREFIX}${event.conversation_id}`
  await client.rpush(REDIS_ALL_KEY, payload)
  await client.rpush(convoKey, payload)

  await client.ltrim(REDIS_ALL_KEY, -MAX_LOGS_PER_LIST, -1)
  await client.ltrim(convoKey, -MAX_LOGS_PER_LIST, -1)

  // Best-effort expiry to keep dev/prod environments tidy.
  try {
    await client.expire(REDIS_ALL_KEY, DERIVED_TTL_SECONDS)
    await client.expire(convoKey, DERIVED_TTL_SECONDS)
  } catch {
    // ignore
  }
}

function parseStoredItem<T>(item: unknown): T {
  if (typeof item === "string") {
    return JSON.parse(item) as T
  }
  return item as T
}

export async function readLogsFromRedis(
  conversation_id?: string
): Promise<LogEvent[]> {
  const client = getRedisClient()
  if (!client) return []

  const key = conversation_id
    ? `${REDIS_CONVO_PREFIX}${conversation_id}`
    : REDIS_ALL_KEY
  const items = await client.lrange<unknown>(key, 0, -1)
  return items.map((item) => parseStoredItem<LogEvent>(item))
}

export async function appendInteractionToRedis(
  event: InteractionEvent
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const payload = JSON.stringify(event)
  const convoKey = `${REDIS_INTERACTIONS_CONVO_PREFIX}${event.conversation_id}`
  await client.rpush(REDIS_INTERACTIONS_ALL_KEY, payload)
  await client.rpush(convoKey, payload)

  await client.ltrim(REDIS_INTERACTIONS_ALL_KEY, -MAX_INTERACTIONS_PER_LIST, -1)
  await client.ltrim(convoKey, -MAX_INTERACTIONS_PER_LIST, -1)

  try {
    await client.expire(REDIS_INTERACTIONS_ALL_KEY, DERIVED_TTL_SECONDS)
    await client.expire(convoKey, DERIVED_TTL_SECONDS)
  } catch {
    // ignore
  }
}

export async function readInteractionsFromRedis(
  conversation_id?: string
): Promise<InteractionEvent[]> {
  const client = getRedisClient()
  if (!client) return []

  const key = conversation_id
    ? `${REDIS_INTERACTIONS_CONVO_PREFIX}${conversation_id}`
    : REDIS_INTERACTIONS_ALL_KEY
  const items = await client.lrange<unknown>(key, 0, -1)
  return items.map((item) => parseStoredItem<InteractionEvent>(item))
}

export type ReplayHistoryEntry = {
  id: string
  created_at: string
  yaml: string
  result: unknown
}

export async function appendReplayHistory(
  entry: ReplayHistoryEntry
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.lpush(
    REDIS_REPLAY_HISTORY_KEY,
    JSON.stringify(entry)
  )
  await client.ltrim(REDIS_REPLAY_HISTORY_KEY, 0, 99)
}

export async function readReplayHistory(): Promise<
  ReplayHistoryEntry[]
> {
  const client = getRedisClient()
  if (!client) return []

  const items = await client.lrange<unknown>(
    REDIS_REPLAY_HISTORY_KEY,
    0,
    49
  )
  return items.map((item) =>
    parseStoredItem<ReplayHistoryEntry>(item)
  )
}
