// chatbot/logWriter.ts
import { Redis } from "@upstash/redis";
import { TurnLog } from "./log.types";

const redis = Redis.fromEnv();

/* =========
   PRIMARY TURN LOG
   ========= */
export async function writeTurnLog(entry: TurnLog) {
  const key = `chatlog:${entry.session_id}`;
  await redis.rpush(key, JSON.stringify(entry));
}

/* =========
   AI CALL LOG
   ========= */
type AiCallLogEntry = {
  session_id: string;
  turn_id: number;
  call_id: string;
  model: string;
  temperature: number;
  request_messages: any[];
  response_raw: any;
  response_text: string;
  latency_ms: number;
};

export async function writeAiCallLog(entry: AiCallLogEntry) {
  const key = `chatlog:${entry.session_id}:turn:${entry.turn_id}:ai`;
  await redis.rpush(key, JSON.stringify(entry));
}
