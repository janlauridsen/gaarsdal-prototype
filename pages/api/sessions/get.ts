// pages/api/sessions/get.ts
import type { NextApiRequest, NextApiResponse } from "next";

const URL = process.env.UPSTASH_REDIS_REST_URL!;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId, password } = JSON.parse(req.body || "{}");

  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });

  const r = await fetch(`${URL}/lrange/session_${sessionId}_messages/0/200`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const data = await r.json();

  const messages = data.result
    .map((x: string) => JSON.parse(x))
    .sort((a: any, b: any) => a.time - b.time);

  res.json({ ok: true, messages });
}
