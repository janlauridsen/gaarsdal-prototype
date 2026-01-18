import type { NextApiRequest, NextApiResponse } from "next"
import { readLogs } from "../../chat/logging/sink"

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { conversation_id } = req.query
  res.status(200).json(
    readLogs(
      typeof conversation_id === "string"
        ? conversation_id
        : undefined
    )
  )
}
