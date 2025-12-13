// pages/api/admin-session.ts
import type { NextApiRequest, NextApiResponse } from "next";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.parse(req.body || "{}");

  if (body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ ok: false });

  if (!body.sessionId)
    return res.status(400).json({ ok: false, error: "Missing sessionId" });

  const key = `session_${body.sessionId}`;

  const msgRes = await fetch(`${REDIS_URL}/lrange/${key}/0/200`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });

  const json = await msgRes.json();
  const raw = json.result || [];

  const messages = raw
    .map((x: string) => {
      try {
        return JSON.parse(x);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  res.status(200).json({
    ok: true,
    messages,
  });
}
