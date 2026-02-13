import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

export function redisEnabled(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export function getRedisClient(): Redis | null {
  if (!redisEnabled()) return null
  if (!redisClient) {
    redisClient = Redis.fromEnv()
  }
  return redisClient
}
