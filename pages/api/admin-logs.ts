// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

// Opret Upstash klient
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Hent de seneste 100 logs
  const rawLogs = await redis.lrange("chatlogs", 0, 100);

  const logs = rawLogs
    .map((entry: any) => {
      try {
        return JSON.parse(entry);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return res.status(200).json({ ok: true, logs });
}
