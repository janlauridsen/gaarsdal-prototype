// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.parse(req.body || "{}");

  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Hent logs fra Redis
  const redisRes = await fetch(`${REDIS_URL}/lrange/chatlogs/0/100`, {
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  });

  const data = await redisRes.json();

  // Upstash returnerer strings → parse dem
  const logs = data.result
    .map((x: string) => {
      try {
        return JSON.parse(x);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return res.status(200).json({ ok: true, logs });
}
