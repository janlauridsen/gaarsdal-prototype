import { Redis } from "@upstash/redis"
import type { LogEvent } from "../kernel/types"

const REDIS_ALL_KEY = "gaarsdal:logs:all"
const REDIS_CONVO_PREFIX = "gaarsdal:logs:"
const REDIS_REPLAY_HISTORY_KEY = "gaarsdal:replay:history"

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
  await client.rpush(REDIS_ALL_KEY, payload)
  await client.rpush(
    `${REDIS_CONVO_PREFIX}${event.conversation_id}`,
    payload
  )
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
