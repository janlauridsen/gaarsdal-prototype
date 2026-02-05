import type { NextApiRequest, NextApiResponse } from "next"
import { readInteractions } from "../../chat/logging/sink"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { conversation_id } = req.query
  const interactions = await readInteractions(
    typeof conversation_id === "string"
      ? conversation_id
      : undefined
  )
  res.status(200).json(interactions)
}
