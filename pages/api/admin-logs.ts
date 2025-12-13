// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.parse(req.body || "{}");

  if (body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false });

  const sessionsRes = await fetch(`${REDIS_URL}/lrange/sessions/0/200`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });

  const json = await sessionsRes.json();
  const raw = json.result || [];

  const sessions = raw
    .map((x: string) => {
      try {
        return JSON.parse(x);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .map((s: any) => ({
      sessionId: s.sessionId,
      started: s.started,
    }));

  res.status(200).json({
    ok: true,
    sessions,
  });
}
