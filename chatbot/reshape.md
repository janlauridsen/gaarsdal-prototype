import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog, writeAiCallLog, AiCallLogEntry } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const SESSION_TIMEOUT_HOURS = 24;
const ENABLE_AI_CALL_LOGGING = process.env.ENABLE_AI_CALL_LOGGING === "true";

const PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PATH = path.join(process.cwd(), "chatbot/evaluator.md");
const RESHAPE_PATH = path.join(process.cwd(), "chatbot/reshape.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

/* TRIN A */
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

/* TRIN C */
function computeControlSignal(input: {
  recentUserTexts: string[];
  recentLoads: Array<"low" | "medium" | "high">;
}): { mode: "normal" | "simplify" | "clarify" | "close"; reason: string } {
  const { recentUserTexts, recentLoads } = input;

  const shortReplies = recentUserTexts.filter(t => t.trim().length <= 8).length >= 2;
  const repeatedHigh = recentLoads.filter(l => l === "high").length >= 2;

  if (shortReplies) return { mode: "close", reason: "gentagne korte svar" };
  if (repeatedHigh) return { mode: "simplify", reason: "gentagen høj belastning" };
  return { mode: "normal", reason: "ingen mønster" };
}

function reshapeHintFor(mode: "normal" | "simplify" | "clarify" | "close"): string {
  switch (mode) {
    case "simplify":
      return "Hold svaret kort. Ét fokus. Undgå spørgsmål.";
    case "clarify":
      return "Afklar ét punkt. Stil højst ét simpelt spørgsmål.";
    case "close":
      return "Afslut roligt uden at åbne nye spor.";
    default:
      return "";
  }
}

/* OPENAI */
async function callOpenAI(params: {
  call_id: string;
  session_id: string;
  turn_id: number;
  messages: any[];
}) {
  const startedAt = Date.now();
  const model = "gpt-4o-mini";
  const temperature = 0.2;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, temperature, messages: params.messages }),
  } as RequestInit);

  const raw = await response.json();
  const text = raw?.choices?.[0]?.message?.content?.trim() ?? "";
  const latency = Date.now() - startedAt;

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

/* API */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const startedAt = Date.now();

  try {
    const { messages, sessionId } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const prompt = loadFile(PROMPT_PATH);
    const evaluatorPrompt = loadFile(EVALUATOR_PATH);
    const reshapePrompt = loadFile(RESHAPE_PATH);
    const facts = loadFile(FACTS_PATH);

    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserText = userMessages.at(-1)?.content ?? "";
    const turnIndex = userMessages.length;

    // Session observation
    const now = Date.now();
    const sessionKey = `session:last_user_at:${sessionId}`;
    const prev = sessionId ? await redis.get<string>(sessionKey) : null;
    const lastUserAt = new Date(now).toISOString();
    if (sessionId) await redis.set(sessionKey, lastUserAt);
    const sessionAgeMs = prev ? now - new Date(prev).getTime() : 0;
    const dialogueExpiresAt = new Date(
      now + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000
    ).toISOString();

    // JAN RAW
    const janRaw = await callOpenAI({
      call_id: "jan_raw",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        { role: "system", content: `${prompt}\n\nAUTORISERET VIDEN:\n${facts}` },
        ...messages,
      ],
    });

    // EVALUATOR
    const evaluatorText = await callOpenAI({
      call_id: "evaluator",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        { role: "system", content: evaluatorPrompt },
        { role: "user", content: janRaw },
      ],
    });

    // TRIN A
    const loadEstimate = estimateLoad(janRaw.length);
    const recentUserTexts = userMessages.slice(-3).map((m: any) => m.content);
    const control = computeControlSignal({
      recentUserTexts,
      recentLoads: [loadEstimate],
    });

    // RESHAPE med C.2 hint
    const controlHint = reshapeHintFor(control.mode);
    const janFinal = await callOpenAI({
      call_id: "reshape",
      session_id: sessionId,
      turn_id: turnIndex,
      messages: [
        {
          role: "system",
          content: controlHint
            ? `${reshapePrompt}\n\nSTILSIGNAL:\n${controlHint}`
            : reshapePrompt,
        },
        {
          role: "user",
          content: `JAN RAW:\n${janRaw}\n\nEVALUATOR:\n${evaluatorText}`,
        },
      ],
    });

    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      turn_id: turnIndex,

      user_text: lastUserText,
      jan_raw: janRaw,
      jan_final: janFinal,
      answer: janFinal,

      evaluator_text: evaluatorText,
      evaluator_present: Boolean(evaluatorText),

      chips_present: false,
      chip_clicked: null,

      turn_index: turnIndex,
      user_message_length: lastUserText.length,
      ai_message_length: janFinal.length,

      turn_observation: {
        question_count: countQuestions(janFinal),
        topic_hash: simpleTopicHash(lastUserText),
      },

      turn_indicators: {
        load_estimate: estimateLoad(janFinal.length),
      },

      control_signal: {
        mode: control.mode,
        reason: control.reason,
      },

      last_user_at: lastUserAt,
      session_age_ms: sessionAgeMs,
      dialogue_expires_at: dialogueExpiresAt,
      resume_prompted: false,

      latency_ms: Date.now() - startedAt,
      status: "ok",
    };

    await writeTurnLog(logEntry);
    return res.status(200).json({ answer: janFinal });
  } catch (err: any) {
    const errorLog: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: req.body?.sessionId ?? "unknown",
      turn_id: -1,
      user_text: "",
      jan_raw: "",
      jan_final: "",
      answer: "",
      evaluator_text: null,
      evaluator_present: false,
      chips_present: false,
      chip_clicked: null,
      latency_ms: Date.now(),
      status: "error",
      error: String(err),
    };
    await writeTurnLog(errorLog);
    return res.status(500).json({ error: "Internal server error" });
  }
}
