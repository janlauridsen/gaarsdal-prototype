// pages/api/admin-session.ts
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

  let body: any = {};
  try {
    body = JSON.parse(req.body);
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  if (!body.sessionId)
    return res.status(400).json({ ok: false, error: "Missing sessionId" });

  const messagesRaw = await redis.lrange(
    `session_${body.sessionId}_messages`,
    0,
    -1
  );

  const messages = messagesRaw
    .map((m: string) => {
      try {
        return JSON.parse(m);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  res.status(200).json({ ok: true, messages });
}
