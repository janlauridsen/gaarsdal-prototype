// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  // Acceptér KUN POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Parse body
  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON body" });
  }

  // Password check
  if (body["password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Hent sessions-listen
  const listRes = await fetch(`${REDIS_URL}/lrange/sessions/0/-1`, {
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  });

  const listData = await listRes.json();
  if (!listData.result) {
    return res.status(200).json({ ok: true, sessions: [] });
  }

  // Parse session-entries
  const sessions = listData.result.map((raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Tilføj metadata til hver session (hvis du ønsker det)
  const enriched = [];

  for (const s of sessions) {
    const metaKey = `session_meta_${s.sessionId}`;
    const metaRes = await fetch(`${REDIS_URL}/get/${metaKey}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });

    const metaData = await metaRes.json();
    let meta = null;

    if (metaData.result) {
      try {
        meta = JSON.parse(metaData.result);
      } catch {}
    }

    enriched.push({
      ...s,
      meta
    });
  }

  res.status(200).json({
    ok: true,
    sessions: enriched
  });
}
