import type { NextApiRequest, NextApiResponse } from "next"
import { readTelemetryTurns } from "../../chat/telemetry/store"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const limitRaw = req.query.limit
  const limit = typeof limitRaw === "string" ? parseInt(limitRaw, 10) : 100

  const userKey = typeof req.query.userKey === "string" ? req.query.userKey : undefined
  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : undefined

  const turns = await readTelemetryTurns({
    userKey,
    conversationId,
    limit: Number.isFinite(limit) ? limit : 100,
  })

  return res.status(200).json({
    total: turns.length,
    turns,
  })
}
