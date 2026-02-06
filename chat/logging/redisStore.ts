import { Redis } from "@upstash/redis"
import type { LogEvent } from "../kernel/types"
import type { InteractionEvent } from "./sink"

let client: Redis | null = null

export function redisEnabled(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL)
}

function getClient(): Redis {
  if (!client) {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return client
}

const LOG_KEY = "chat:logs"
const INTERACTION_KEY = "chat:interactions"

export async function appendLogToRedis(event: LogEvent): Promise<void> {
  const redis = getClient()
  await redis.rpush(LOG_KEY, event)
}

export async function appendInteractionToRedis(
  event: InteractionEvent
): Promise<void> {
  const redis = getClient()
  await redis.rpush(INTERACTION_KEY, event)
}

export async function readLogsFromRedis(
  conversation_id?: string
): Promise<LogEvent[]> {
  const redis = getClient()
  const list = await redis.lrange<LogEvent>(LOG_KEY, 0, -1)
  if (!conversation_id) return list
  return list.filter((e) => e.conversation_id === conversation_id)
}

export async function readInteractionsFromRedis(
  conversation_id?: string
): Promise<InteractionEvent[]> {
  const redis = getClient()
  const list = await redis.lrange<InteractionEvent>(INTERACTION_KEY, 0, -1)
  if (!conversation_id) return list
  return list.filter((e) => e.conversation_id === conversation_id)
}
