// pages/api/sessions/list.ts
import type { NextApiRequest, NextApiResponse } from "next";

const URL = process.env.UPSTASH_REDIS_REST_URL!;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = JSON.parse(req.body || "{}");
  if (body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });

  const r = await fetch(`${URL}/lrange/sessions/0/200`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  const data = await r.json();
  const sessions = data.result
    .map((i: string) => JSON.parse(i))
    .sort((a: any, b: any) => b.started - a.started);

  res.json({ ok: true, sessions });
}
