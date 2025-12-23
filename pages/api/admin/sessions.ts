import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminAuth } from "../../../lib/admin-auth";
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
       ADMIN AUTH (kun i live prod)
    ---------------------------------- */
    requireAdminAuth(req);

    /* ----------------------------------
       FIND ALLE META-KEYS
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
        sessions.push(JSON.parse(metaJson.result));
      }
    }

    /* ----------------------------------
       SORTÉR (nyeste først)
    ---------------------------------- */
    sessions.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() -
        new Date(a.startedAt).getTime()
    );

    return res.status(200).json({ sessions });
  } catch (err: any) {
    if (err.statusCode === 401) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.error("admin/sessions error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
