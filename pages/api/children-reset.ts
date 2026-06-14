import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "./_utils/auth"
import { getRedisClient } from "../../chat/persistence/redis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const userKey = ensureUserKey(req, res)
  if (!userKey) return

  const conversationId = `lobby:u:${userKey}`

  try {
    const redis = getRedisClient()
    if (redis) {
      await Promise.all([
        // Ny namespaced nøgle (matcher conversationStateStore key-format)
        redis.del(`gaarsdal:state:children:${conversationId}`),
        // Gammel delt nøgle (oprydning af evt. forurenet state fra før namespace-fix)
        redis.del(`gaarsdal:state:${conversationId}`),
        redis.del(`children:events:v1:conv:${conversationId}`),
        redis.del(`children:raw:conversation:${conversationId}`),
      ])
    }
  } catch (e) {
    console.error("[children-reset]", e)
  }

  return res.status(200).json({ ok: true })
}
