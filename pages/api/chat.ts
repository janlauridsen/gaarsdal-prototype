import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PROMPT_PATH = path.join(
  process.cwd(),
  "chatbot/evaluator.md"
);
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

/* =========
   Evaluator text extraction (runtime-neutral)
   ========= */
function extractEvaluator(text: string): string | null {
  const match = text.match(
    /\[evaluator:\][\s\S]*?\[evaluator-hint:\][\s\S]*/i
  );
  return match ? match[0].trim() : null;
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

    const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
    const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);
    const facts = loadFile(FACTS_PATH);

    const openAiMessages = [
      {
        role: "system",
        content: `
${systemPrompt}

---

${evaluatorPrompt}

---

AUTORISERET VIDEN:
${facts}
        `.trim(),
      },
      ...messages,
    ];

    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserText = userMessages.at(-1)?.content ?? "";

    /* =========
       JAN (RAW)
       ========= */
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          messages: openAiMessages,
        }),
      } as RequestInit // 👈 VIGTIG TS-FIX
    );

    const rawData = await response.json();

    const janRaw =
      rawData?.choices?.[0]?.message?.content?.trim() ?? "";

    /* =========
       Evaluator observability (TEXT ONLY)
       ========= */
    const evaluatorText = extractEvaluator(janRaw);

    const janFinal = janRaw;

    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: userMessages.length,

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
      evaluator: evaluatorText ?? null,
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
