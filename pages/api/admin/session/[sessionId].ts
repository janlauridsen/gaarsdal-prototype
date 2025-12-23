import type { NextApiRequest, NextApiResponse } from "next";
import type { SessionMeta, SessionTurn } from "../../../../lib/admin-types";


const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

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
    let meta: SessionMeta | null = null;

    if (metaJson?.result) {
      meta =
        typeof metaJson.result === "string"
          ? JSON.parse(metaJson.result)
          : metaJson.result;
    }

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
      .map((x: string) => {
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
