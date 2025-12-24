// lib/playback/getLoggedSession.ts
import type { LoggedSession, LoggedTurn } from "./replay-types";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

/**
 * Henter en fuld logget session (meta + turns)
 * og samler den i LoggedSession-format.
 */
export async function getLoggedSession(
  sessionId: string
): Promise<LoggedSession | null> {
  /* ---------------- META ---------------- */
  const metaRes = await fetch(
    `${REDIS_URL}/get/${encodeURIComponent(
      `session:${sessionId}:meta`
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    }
  );

  const metaJson = await metaRes.json();
  if (!metaJson?.result) return null;

  const meta =
    typeof metaJson.result === "string"
      ? JSON.parse(metaJson.result)
      : metaJson.result;

  /* ---------------- TURNS ---------------- */
  const turnsRes = await fetch(
    `${REDIS_URL}/lrange/${encodeURIComponent(
      `session:${sessionId}:turns`
    )}/0/-1`,
    {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    }
  );

  const turnsJson = await turnsRes.json();

  const turns: LoggedTurn[] = (turnsJson.result || [])
    .map((x: string) => {
      try {
        return typeof x === "string" ? JSON.parse(x) : x;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return {
    ...meta,
    turns,
  };
}
