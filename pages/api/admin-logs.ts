// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

async function redisGet(path: string) {
  const res = await fetch(`${REDIS_URL}/${path}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = JSON.parse(req.body || "{}");

  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // 1) Hent liste over sessions
  const sessionList = await redisGet("lrange/sessions/0/-1");

  if (!sessionList.result || sessionList.result.length === 0) {
    return res.status(200).json({ ok: true, sessions: [] });
  }

  const sessions: any[] = [];

  // 2) Loop igennem hver session
  for (const s of sessionList.result) {
    let parsed;
    try {
      parsed = JSON.parse(s);
    } catch {
      continue;
    }

    const sessionId = parsed.sessionId;

    // Hent metadata
    const metaRes = await redisGet(`get/session_meta_${sessionId}`);
    let meta = null;
    if (metaRes.result) {
      try {
        meta = JSON.parse(metaRes.result);
      } catch {}
    }

    // Hent beskeder
    const msgRes = await redisGet(`lrange/session_${sessionId}_messages/0/-1`);

    let messages = [];
    if (msgRes.result) {
      messages = msgRes.result
        .map((m: string) => {
          try {
            return JSON.parse(m);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    }

    sessions.push({
      sessionId,
      started: parsed.started,
      meta,
      messages,
    });
  }

  res.status(200).json({ ok: true, sessions });
}
