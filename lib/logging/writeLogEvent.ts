// lib/logging/writeLogEvent.ts

import { RMRCLogEvent } from "./logEvent";
import { redis } from "../redis";

export async function writeLogEvent(event: RMRCLogEvent): Promise<void> {
  const key = `rmrc:session:${event.sessionId}:events`;

  await redis.rpush(key, JSON.stringify(event));
}
