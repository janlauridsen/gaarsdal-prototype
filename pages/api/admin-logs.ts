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

  // Fetch all chatlogs
  const raw = await fetch(`${REDIS_URL}/lrange/chatlogs/0/999`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });

  const result = await raw.json();
  if (!result.result) return res.status(200).json({ ok: true, sessions: [] });

  // Parse logs
  const entries = result.result
    .map((v: string) => {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Group by sessionId
  const sessions: any = {};
  for (const e of entries) {
    if (!e.sessionId) continue;

    if (!sessions[e.sessionId]) {
      sessions[e.sessionId] = {
        sessionId: e.sessionId,
        started: e.time,
        messages: [],
      };
    }

    if (e.role || e.type) {
      sessions[e.sessionId].messages.push(e);
    }

    // update earliest timestamp as session.start
    if (e.time < sessions[e.sessionId].started) {
      sessions[e.sessionId].started = e.time;
    }
  }

  // Convert to array
  const sessionList = Object.values(sessions)
    .sort((a: any, b: any) => b.started - a.started);

  return res.status(200).json({
    ok: true,
    sessions: sessionList,
  });
}
