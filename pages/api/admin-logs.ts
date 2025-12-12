// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.parse(req.body || "{}");

  // Sikkerhed: adgangskode check
  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    // Hent seneste 100 logs
    const raw = await redis.lrange("chatlogs", 0, 100);

    const logs = raw
      .map((x) => {
        try {
          return JSON.parse(x);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({ ok: true, logs });
  } catch (err) {
    console.error("REDIS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Redis fetch failed" });
  }
}
