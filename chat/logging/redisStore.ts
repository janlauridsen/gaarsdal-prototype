import { Redis } from "@upstash/redis"
import type { LogEvent } from "../kernel/types"

const REDIS_ALL_KEY = "gaarsdal:logs:all"
const REDIS_CONVO_PREFIX = "gaarsdal:logs:"

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

export async function readLogsFromRedis(
  conversation_id?: string
): Promise<LogEvent[]> {
  const client = getRedisClient()
  if (!client) return []

  const key = conversation_id
    ? `${REDIS_CONVO_PREFIX}${conversation_id}`
    : REDIS_ALL_KEY
  const items = await client.lrange<string>(key, 0, -1)
  return items.map((item) => JSON.parse(item) as LogEvent)
}
