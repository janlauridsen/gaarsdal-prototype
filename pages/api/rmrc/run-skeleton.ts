import type { NextApiRequest, NextApiResponse } from "next"
import { runRMRCSessionSkeleton } from "../../../lib/rmrc/runtime.skeleton"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const sessionId =
      typeof req.query.sessionId === "string"
        ? req.query.sessionId
        : `rmrc-skeleton-${Date.now()}`

    await runRMRCSessionSkeleton(sessionId)

    res.status(200).json({
      status: "ok",
      sessionId,
    })
  } catch (error) {
    console.error("RMRC skeleton run failed", error)
    res.status(500).json({ error: "RMRC skeleton failed" })
  }
}

