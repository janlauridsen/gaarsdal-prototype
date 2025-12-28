/**
 * Minimal Upstash Redis REST client.
 *
 * This implementation intentionally avoids any external dependencies.
 * It supports ONLY the commands required for RMRC logging:
 * - RPUSH
 * - LRANGE
 */

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis environment variables are missing")
}

async function redisFetch(command: string[]): Promise<any> {
  const response = await fetch(UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  })

  const result = await response.json()
  return result.result
}

export const redis = {
  async rpush(key: string, value: string): Promise<void> {
    await redisFetch(["RPUSH", key, value])
  },

  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    return await redisFetch(["LRANGE", key, start.toString(), stop.toString()])
  },
}
