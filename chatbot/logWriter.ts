// chatbot/logWriter.ts
import { Redis } from "@upstash/redis";
import { TurnLog } from "./log.types";

const redis = Redis.fromEnv();

function keyForSession(sessionId: string) {
  return `chatlog:${sessionId}`;
}

export async function writeTurnLog(entry: TurnLog) {
  const key = keyForSession(entry.session_id);

  // append som NDJSON-linje
  await redis.rpush(key, JSON.stringify(entry));

  // ingen TTL her (kan tilføjes senere bevidst)
}
