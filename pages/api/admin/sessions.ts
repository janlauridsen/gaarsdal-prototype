// pages/api/admin/sessions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionMeta } from "../../../lib/admin-types";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Find alle session meta keys
    const keysRes = await fetch(
      `${REDIS_URL}/keys/${encodeURIComponent("session:*:meta")}`,
      {
        headers: {
          Authorization: `Bearer ${REDIS_TOKEN}`,
        },
      }
    );

    const keysJson = await keysRes.json();
    const keys: string[] = keysJson.result || [];

    // 2. Hent meta for hver session
    const sessions: SessionMeta[] = [];

    for (const key of keys) {
      const metaRes = await fetch(
        `${REDIS_URL}/get/${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${REDIS_TOKEN}`,
          },
        }
      );

      const metaJson = await metaRes.json();
      if (metaJson?.result) {
        sessions.push(JSON.parse(metaJson.result));
      }
    }

    // 3. Sortér nyeste først
    sessions.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() -
        new Date(a.startedAt).getTime()
    );

    return res.status(200).json({ sessions });
  } catch (err: any) {
    console.error("Admin sessions error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
