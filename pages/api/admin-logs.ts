// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  if (!req.body)
    return res.status(400).json({ ok: false, error: "Missing body" });

  let body: any = {};
  try {
    body = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  // Hent sessions-listen
  const sessionList = await redis.lrange("sessions", 0, -1);

  const sessions = [];

  for (const raw of sessionList) {
    let entry: any;
    try {
      entry = JSON.parse(raw);
    } catch {
      continue;
    }

    const sessionId = entry.sessionId;

    // Hent metadata
    const metaRaw = await redis.get(`session_meta_${sessionId}`);
    let meta = null;
    if (metaRaw) {
      try {
        meta = JSON.parse(metaRaw);
      } catch {}
    }

    // Hent beskedantal
    const count = await redis.llen(`session_${sessionId}_messages`);

    sessions.push({
      sessionId,
      started: entry.started,
      meta,
      messageCount: count,
    });
  }

  res.status(200).json({
    ok: true,
    sessions,
  });
}
