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
    /* ----------------------------------
       FIND ALLE SESSION META KEYS
    ---------------------------------- */
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

    /* ----------------------------------
       HENT META FOR HVER SESSION
    ---------------------------------- */
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
        let parsed: any;

        if (typeof metaJson.result === "string") {
          parsed = JSON.parse(metaJson.result);
        } else {
          parsed = metaJson.result;
        }

        sessions.push({
          ...parsed,
          endedAt: metaJson.endedAt ?? parsed.endedAt,
          closedReason: metaJson.closedReason ?? parsed.closedReason,
        });
      }
    }

    /* ----------------------------------
       SORTÉR (NYESTE FØRST)
    ---------------------------------- */
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
