import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionMeta } from "../../../lib/admin-types";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

function normalizeMeta(raw: any): SessionMeta | null {
  if (!raw) return null;

  let parsed = raw;

  // 1) Hvis raw er string → parse
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  // 2) Hvis parsed har .result som string → parse igen
  if (parsed && typeof parsed.result === "string") {
    try {
      parsed = JSON.parse(parsed.result);
    } catch {
      return null;
    }
  }

  // 3) Hvis parsed stadig har .result (objekt) → unwrap
  if (parsed && typeof parsed.result === "object") {
    parsed = parsed.result;
  }

  if (!parsed.sessionId || !parsed.startedAt) {
    return null;
  }

  return parsed as SessionMeta;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
       LOAD + NORMALISÉR META
    ---------------------------------- */
    const sessions: SessionMeta[] = [];

    for (const key of keys) {
      try {
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

        const normalized = normalizeMeta(metaJson?.result);
        if (!normalized) continue;

        sessions.push({
          ...normalized,
          endedAt: metaJson.endedAt ?? normalized.endedAt,
          closedReason: metaJson.closedReason ?? normalized.closedReason,
        });
      } catch {
        // skip corrupt entry
      }
    }

    /* ----------------------------------
       SORTÉR NYESTE FØRST
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
