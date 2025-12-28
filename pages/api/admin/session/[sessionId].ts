import type { NextApiRequest, NextApiResponse } from "next"
import { RedisLogReader } from "../../../../lib/logging/redis.log.reader"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query

  if (typeof sessionId !== "string") {
    return res.status(400).json({ error: "Invalid sessionId" })
  }

  const reader = new RedisLogReader()
  const logs = await reader.getSessionLogs(sessionId)

  res.status(200).json(logs)
}
