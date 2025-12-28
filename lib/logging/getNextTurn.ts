// lib/logging/getNextTurn.ts

import { redis } from "../redis";
import { RMRCLogEvent } from "./logEvent";

export async function getNextTurn(sessionId: string): Promise<number> {
  const key = `rmrc:session:${sessionId}:events`;
  const rawEvents = (await redis.lrange(key, 0, -1)) ?? [];

  const events: RMRCLogEvent[] = rawEvents.map((e) => JSON.parse(e));

  const turns = events
    .map((e) => e.turn)
    .filter((t): t is number => typeof t === "number");

  if (turns.length === 0) return 1;

  return Math.max(...turns) + 1;
}
