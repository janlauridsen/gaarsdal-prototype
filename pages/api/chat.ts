// pages/api/chat.ts
// v10.0 BASELINE — CHIP-ONLY FLOW

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

import {
  writeTurnLog,
  writeAiCallLog,
  AiCallLogEntry,
} from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";

/* =========
   REDIS
   ========= */
const redis = Redis.fromEnv();

/* =========
   CONFIG
   ========= */
const SESSION_TTL_HOURS = 24;
const ENABLE_AI_CALL_LOGGING =
  process.env.ENABLE_AI_CALL_LOGGING === "true";

/* =========
   PATHS
   ========= */
const PROMPTS = {
  contact: path.join(process.cwd(), "chatbot/v10/contact.prompt.md"),
  facts: path.join(process.cwd(), "chatbot/v10/facts.prompt.md"),
  triage: path.join(process.cwd(), "chatbot/v10/triage.prompt.md"),
  dummy: path.join(process.cwd(), "chatbot/v10/dummy.prompt.md"),
};

/* =========
   HELPERS
   ========= */
function load(p: string) {
  return fs.readFileSync(p, "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

/* =========
   OPENAI
   ========= */
async function callOpenAI(params: {
  call_id: string;
  session_id: string;
  turn_id: number;
  messages: any[];
}) {
  const startedAt = Date.now();
  const model = "gpt-4o-mini";
  const temperature = 0;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
  } as RequestInit);

  const latency = Date.now() - startedAt;
  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${rawText.slice(0, 200)}`);
  }

  const raw = JSON.parse(rawText);
  const text = raw?.choices?.[0]?.message?.content?.trim() ?? "";

  if (ENABLE_AI_CALL_LOGGING) {
    const aiLog: AiCallLogEntry = {
      timestamp: nowIso(),
      session_id: params.session_id,
      turn_id: params.turn_id,
      call_id: params.call_id,
      model,
      temperature,
      request_messages: params.messages,
      response_raw: raw,
      response_text: text,
      latency_ms: latency,
    };
    await writeAiCallLog(aiLog);
  }

  return text;
}

/* =========
   API HANDLER
   ========= */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const startedAt = Date.now();

  const { sessionId, messages, chip } = req.body ?? {};

  if (!sessionId || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const userMessages = messages.filter((m: any) => m.role === "user");
  const lastUserText = userMessages.at(-1)?.content ?? "";
  const turnIndex = userMessages.length;

  const sessionKey = `session:last_user_at:${sessionId}`;
  const prev = await redis.get<string>(sessionKey);
  await redis.set(sessionKey, nowIso());

  const sessionAgeMs = prev
    ? Date.now() - new Date(prev).getTime()
    : 0;

  /* =========
     CHIP ROUTING
     ========= */
  let scope: "contact" | "facts" | "triage" | "dummy" = "dummy";

  if (chip === "contact") scope = "contact";
  if (chip === "facts") scope = "facts";
  if (chip === "triage") scope = "triage";

  const systemPrompt = load(PROMPTS[scope]);

  let answer = "";

  try {
    answer = await callOpenAI({
      call_id: `v10_${scope}`,
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: lastUserText },
      ],
    });

    const log: TurnLog = {
      timestamp: nowIso(),
      session_id: sessionId,
      turn_id: turnIndex,
      user_input: lastUserText,
      jan_raw_output: "",
      jan_final_output: answer,
      evaluator_present: false,
      telemetry: {
        v10: {
          chip: chip ?? null,
          scope,
        },
        session_age_ms: sessionAgeMs,
      },
      latency_ms: Date.now() - startedAt,
      status: "ok",
    };

    await writeTurnLog(log);

    return res.status(200).json({
      answer,
      chips: ["contact", "facts", "triage"],
    });
  } catch (err: any) {
    const errorLog: TurnLog = {
      timestamp: nowIso(),
      session_id: sessionId,
      turn_id: turnIndex,
      user_input: lastUserText,
      jan_raw_output: "",
      jan_final_output: "",
      evaluator_present: false,
      telemetry: { error: String(err) },
      latency_ms: Date.now() - startedAt,
      status: "error",
      error: String(err),
    };

    await writeTurnLog(errorLog);
    return res.status(500).json({ error: "Internal error" });
  }
}

