// chatbot/logWriter.ts
import { Redis } from "@upstash/redis";
import { TurnLog, ExecutionContext } from "./log.types";

const redis = Redis.fromEnv();

/* =========
   PRIMARY TURN LOG (UÆNDRET)
   ========= */
export async function writeTurnLog(entry: TurnLog) {
  const key = `chatlog:${entry.session_id}`;
  await redis.rpush(key, JSON.stringify(entry));
}

/* =========
   AI CALL LOG (UDVIDET, BAGUDKOMPATIBEL)
   ========= */

/**
 * NOTE:
 * Dette er en additiv udvidelse af eksisterende
 * AI-call logging. Eksisterende felter bevares.
 */
export type AiCallLogEntry = {
  /* --- Core --- */
  timestamp: string;
  session_id: string;
  turn_id: number;

  /**
   * Identificerer hvilket kald i flowet
   * fx "jan_raw" | "evaluator" | "reshape"
   */
  call_id: string;

  /**
   * Hvordan dette kald blev afviklet
   * live | replay | test
   */
  execution_context?: ExecutionContext;

  /* --- Versionering --- */
  code_version?: string;
  prompt_version?: string;
  evaluator_version?: string;
  reshape_version?: string;

  /* --- Model & request --- */
  model: string;
  temperature: number;
  request_messages: any[];

  /* --- Response --- */
  response_raw: any;
  response_text: string;

  /* --- Drift --- */
  latency_ms: number;
  status?: "ok" | "error";
  error?: string;
};

/**
 * Skriver AI-call logs.
 * Redis-key er uændret for kompatibilitet.
 */
export async function writeAiCallLog(
  entry: AiCallLogEntry
) {
  const key = `chatlog:${entry.session_id}:turn:${entry.turn_id}:ai`;
  await redis.rpush(key, JSON.stringify(entry));
}
