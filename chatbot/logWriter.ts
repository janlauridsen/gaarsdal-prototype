import { Redis } from "@upstash/redis";
import { TurnLog } from "./log.types";

const redis = Redis.fromEnv();

function sessionKey(sessionId: string) {
  return `chatlog:${sessionId}`;
}

export async function writeTurnLog(entry: TurnLog) {
  const key = sessionKey(entry.session_id);

  await redis.rpush(key, JSON.stringify(entry));

  // valgfrit: sæt TTL (fx 30 dage)
  await redis.expire(key, 60 * 60 * 24 * 30);
}
