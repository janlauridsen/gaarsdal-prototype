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
      // Check if gaarsdal:state is a children conversation before deleting
      const stateRaw = await redis.get(`gaarsdal:state:${conversationId}`)
      const keysToDelete = [
        `children:state:${conversationId}`,
        `children:events:v1:conv:${conversationId}`,
        `children:raw:conversation:${conversationId}`,
      ]
      if (stateRaw) {
        try {
          const state = JSON.parse(stateRaw as string)
          if (state?.meta?.chatbotType?.value === "children") {
            keysToDelete.push(`gaarsdal:state:${conversationId}`)
          }
        } catch {}
      }
      await Promise.all(keysToDelete.map(k => redis.del(k)))
    }
  } catch (e) {
    console.error("[children-reset]", e)
  }

  return res.status(200).json({ ok: true })
}
