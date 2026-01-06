import { Redis } from "@upstash/redis";
import { TurnLog } from "./log.types";

const redis = Redis.fromEnv();

export async function writeTurnLog(entry: TurnLog) {
  const key = `chatlog:${entry.session_id}`;
  await redis.rpush(key, JSON.stringify(entry));
}
