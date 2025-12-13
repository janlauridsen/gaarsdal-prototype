// pages/api/admin-session.ts
import type { NextApiRequest, NextApiResponse } from "next";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const body = JSON.parse(req.body || "{}");

  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { sessionId } = body;
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: "Missing sessionId" });
  }

  // Hent beskeder
  const msgRes = await fetch(`${REDIS_URL}/lrange/session_${sessionId}_messages/0/-1`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });

  const msgData = await msgRes.json();
  const messages = (msgData.result || [])
    .map((v: any) => {
      try {
        return JSON.parse(v);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  // Hent metadata
  const metaRes = await fetch(`${REDIS_URL}/get/session_meta_${sessionId}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
  });

  let meta = null;
  try {
    const metaData = await metaRes.json();
    meta = metaData.result ? JSON.parse(metaData.result) : null;
  } catch {}

  res.status(200).json({
    ok: true,
    sessionId,
    messages,
    meta,
  });
}
