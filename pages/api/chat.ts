// pages/api/chat.ts

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
const SESSION_TIMEOUT_HOURS = 24;
const ENABLE_AI_CALL_LOGGING =
  process.env.ENABLE_AI_CALL_LOGGING === "true";

/* =========
   PATHS
   ========= */
const PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PATH = path.join(process.cwd(), "chatbot/evaluator.md");
const RESHAPE_PATH = path.join(process.cwd(), "chatbot/reshape.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");
const INTERPRETER_PATH = path.join(
  process.cwd(),
  "chatbot/conversation-interpreter.prompt.md"
);

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

/* =========
   HELPERS
   ========= */
function countQuestions(text: string): number {
  return (text.match(/\?/g) || []).length;
}

function simpleTopicHash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s]/g, "")
    .split(/\s+/)
    .slice(0, 5)
    .join("_");
}

function estimateLoad(len: number): "low" | "medium" | "high" {
  if (len < 300) return "low";
  if (len < 700) return "medium";
  return "high";
}

/* =========
   OPENAI CALL (HARDENED)
   ========= */
async function callOpenAI(params: {
  call_id: string;
  session_id: string;
  turn_id: number;
  messages: any[];
}) {
  const startedAt = Date.now();
  const model = "gpt-4o-mini";
  const temperature = 0.2;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: params.messages,
    }),
  } as RequestInit);

  const latency = Date.now() - startedAt;
  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(
      `OpenAI HTTP ${res.status}: ${rawText.slice(0, 200)}`
    );
  }

  let raw: any;
  try {
    raw = JSON.parse(rawText);
  } catch {
    throw new Error(
      `OpenAI returned non-JSON response: ${rawText.slice(0, 200)}`
    );
  }

  const text =
    raw?.choices?.[0]?.message?.content?.trim() ?? "";

  if (ENABLE_AI_CALL_LOGGING) {
    const aiLog: AiCallLogEntry = {
      timestamp: new Date().toISOString(),
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

  const { messages, sessionId } = req.body ?? {};
  if (!sessionId || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const userMessages = messages.filter(
    (m: any) => m.role === "user"
  );
  const lastUserText = userMessages.at(-1)?.content ?? "";
  const turnIndex = userMessages.length;

  try {
    const prompt = loadFile(PROMPT_PATH);
    const evaluatorPrompt = loadFile(EVALUATOR_PATH);
    const reshapePrompt = loadFile(RESHAPE_PATH);
    const facts = loadFile(FACTS_PATH);
    const interpreterPrompt = loadFile(INTERPRETER_PATH);

    /* SESSION OBSERVATION */
    const now = Date.now();
    const sessionKey = `session:last_user_at:${sessionId}`;
    const prev = await redis.get<string>(sessionKey);
    const lastUserAt = new Date(now).toISOString();
    await redis.set(sessionKey, lastUserAt);

    const sessionAgeMs = prev
      ? now - new Date(prev).getTime()
      : 0;

    const dialogueExpiresAt = new Date(
      now + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000
    ).toISOString();

    /* =========
       LOAD PREVIOUS INTERPRETER CONTEXT (★ CHANGED)
       ========= */
    let interpreterContext: any = null;
    const cached = await redis.get<string>(
      `interpreter:context:${sessionId}`
    );
    if (cached) {
      try {
        interpreterContext = JSON.parse(cached);
      } catch {
        interpreterContext = null;
      }
    }

    /* =========
       JAN RAW
       ========= */
    const janRawMessages = [
      {
        role: "system",
        content: `${prompt}

AUTORISERET VIDEN:
${facts}

${
  interpreterContext
    ? `INTERPRETER_CONTEXT:
${JSON.stringify(interpreterContext, null, 2)}`
    : ""
}`,
      },
      ...messages,
    ];

    const janRaw = await callOpenAI({
      call_id: "jan_raw",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: janRawMessages,
    });

    /* =========
       EVALUATOR
       ========= */
    const evaluatorText = await callOpenAI({
      call_id: "evaluator",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        { role: "system", content: evaluatorPrompt },
        { role: "user", content: janRaw },
      ],
    });

    /* =========
       RESHAPE
       ========= */
    const janFinal = await callOpenAI({
      call_id: "reshape",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        { role: "system", content: reshapePrompt },
        {
          role: "user",
          content: `JAN RAW:
${janRaw}

EVALUATOR:
${evaluatorText}`,
        },
      ],
    });

    /* =========
       LOG
       ========= */
    const load = estimateLoad(janFinal.length);

    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      turn_id: turnIndex,

      user_input: lastUserText,
      jan_raw_output: janRaw,
      jan_final_output: janFinal,

      evaluator_present: Boolean(evaluatorText),

      session: {
        health: {
          score: load === "high" ? 0.6 : load === "medium" ? 0.8 : 1.0,
          factors: {
            avg_load: load,
            high_load_turns: load === "high" ? 1 : 0,
            turn_count: turnIndex,
          },
        },
      },

      telemetry: {
        answer: janFinal,
        evaluator_text: evaluatorText,
        interpreter_context: interpreterContext,
        turn_index: turnIndex,
        user_message_length: lastUserText.length,
        ai_message_length: janFinal.length,
        turn_observation: {
          question_count: countQuestions(janFinal),
          topic_hash: simpleTopicHash(lastUserText),
        },
        turn_indicators: {
          load_estimate: load,
        },
        last_user_at: lastUserAt,
        session_age_ms: sessionAgeMs,
        dialogue_expires_at: dialogueExpiresAt,
        resume_prompted: false,
      },

      latency_ms: Date.now() - startedAt,
      status: "ok",
    };

    await writeTurnLog(logEntry);

    /* =========
       RETURN TO USER EARLY (★ CHANGED)
       ========= */
    res.status(200).json({ answer: janFinal });

    /* =========
       INTERPRETER – POST RESPONSE (★ CHANGED)
       ========= */
    (async () => {
      try {
        const interpreterRaw = await callOpenAI({
          call_id: "interpreter",
          session_id: sessionId,
          turn_id: turnIndex,
          messages: [
            { role: "system", content: interpreterPrompt },
            {
              role: "user",
              content: JSON.stringify({
                messages,
                session_age_ms: sessionAgeMs,
              }),
            },
          ],
        });

        const parsed = JSON.parse(interpreterRaw);
        await redis.set(
          `interpreter:context:${sessionId}`,
          JSON.stringify(parsed)
        );
      } catch {
        // silent by design
      }
    })();

    return;
  } catch (err: any) {
    const errorLog: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      turn_id: turnIndex,

      user_input: lastUserText,
      jan_raw_output: "",
      jan_final_output: "",

      evaluator_present: false,

      telemetry: {
        error: String(err),
      },

      latency_ms: Date.now() - startedAt,
      status: "error",
      error: String(err),
    };

    await writeTurnLog(errorLog);
    return res.status(500).json({ error: "Internal server error" });
  }
}
