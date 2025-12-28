// pages/api/admin/session/[sessionId]/events.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "../../../../../lib/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const key = `rmrc:session:${sessionId}:events`;
  const events = (await redis.lrange(key, 0, -1)) ?? [];

  // Rå, ufortolket læsning
  res.status(200).json({
    sessionId,
    count: events.length,
    events: events.map((e) => JSON.parse(e)),
  });
}
