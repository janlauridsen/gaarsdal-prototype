import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionMeta, SessionTurn } from "../../../../lib/admin-types";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

function normalizeMeta(raw: any): SessionMeta | null {
  if (!raw) return null;

  let parsed = raw;

  // 1. Hvis raw er string → parse
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  // 2. Hvis parsed.result er string → parse igen
  if (parsed && typeof parsed.result === "string") {
    try {
      parsed = JSON.parse(parsed.result);
    } catch {
      return null;
    }
  }

  // 3. Hvis parsed.result er objekt → unwrap
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

  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    /* ---------------- META ---------------- */
    const metaRes = await fetch(
      `${REDIS_URL}/get/${encodeURIComponent(`session:${sessionId}:meta`)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      }
    );

    const metaJson = await metaRes.json();

    const baseMeta = normalizeMeta(metaJson?.result);

    const meta: SessionMeta | null = baseMeta
      ? {
          ...baseMeta,
          endedAt: metaJson.endedAt ?? baseMeta.endedAt,
          closedReason: metaJson.closedReason ?? baseMeta.closedReason,
        }
      : null;

    /* ---------------- TURNS ---------------- */
    const turnsRes = await fetch(
      `${REDIS_URL}/lrange/${encodeURIComponent(
        `session:${sessionId}:turns`
      )}/0/-1`,
      {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      }
    );

    const turnsJson = await turnsRes.json();
    const turns: SessionTurn[] = (turnsJson.result || [])
      .map((x: any) => {
        try {
          return typeof x === "string" ? JSON.parse(x) : x;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({ meta, turns });
  } catch (err: any) {
    console.error("Admin session error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
