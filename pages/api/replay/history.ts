import type { NextApiRequest, NextApiResponse } from "next"
import * as redisStore from "../../../chat/logging/redisStore"

type ReplayHistoryEntry = {
  id: string
  created_at: string
  yaml: string
  result: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const readReplayHistory = (redisStore as {
    readReplayHistory?: () => Promise<ReplayHistoryEntry[]>
  }).readReplayHistory

  const history = readReplayHistory ? await readReplayHistory() : []
  res.status(200).json({ history })
}
