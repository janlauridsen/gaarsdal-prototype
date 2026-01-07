import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";

const PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PATH = path.join(process.cwd(), "chatbot/evaluator.md");
const RESHAPE_PATH = path.join(process.cwd(), "chatbot/reshape.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

async function callOpenAI(messages: any[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages,
    }),
  } as RequestInit);

  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() ?? "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

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
    const turnId = userMessages.length;

    /* =========
       CALL 1 · JAN RAW
       ========= */
    const janStarted = Date.now();

    const janRaw = await callOpenAI([
      {
        role: "system",
        content: `
${prompt}

---

AUTORISERET VIDEN:
${facts}
        `.trim(),
      },
      ...messages,
    ]);

    const janLatency = Date.now() - janStarted;

    /* =========
       CALL 2 · EVALUATOR
       ========= */
    const evalStarted = Date.now();

    const evaluatorText = await callOpenAI([
      {
        role: "system",
        content: evaluatorPrompt,
      },
      {
        role: "user",
        content: janRaw,
      },
    ]);

    const evalLatency = Date.now() - evalStarted;

    /* =========
       CALL 3 · RESHAPE
       ========= */
    const reshapeStarted = Date.now();

    const janFinal = await callOpenAI([
      {
        role: "system",
        content: reshapePrompt,
      },
      {
        role: "user",
        content: `
JAN RAW:
${janRaw}

---

EVALUATOR:
${evaluatorText}
        `.trim(),
      },
    ]);

    const reshapeLatency = Date.now() - reshapeStarted;

    /* =========
       LOGGING
       ========= */
    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: turnId,

      user_text: lastUserText,

      jan_raw: janRaw,
      jan_final: janFinal,
      answer: janFinal,

      evaluator_text: evaluatorText,
      evaluator_present: Boolean(evaluatorText),

      chips_present: false,
      chip_clicked: null,

      latency_ms: Date.now() - startedAt,
      status: "ok",
    };

    await writeTurnLog(logEntry);

    return res.status(200).json({
      answer: janFinal,
      debug: {
        jan_latency: janLatency,
        evaluator_latency: evalLatency,
        reshape_latency: reshapeLatency,
      },
    });
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

      latency_ms: Date.now() - startedAt,
      status: "error",
      error: String(err),
    };

    await writeTurnLog(errorLog);

    return res.status(500).json({ error: "Internal server error" });
  }
}
