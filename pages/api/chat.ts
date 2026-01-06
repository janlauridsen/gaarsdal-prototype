// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
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
    const {
      messages,
      sessionId,
      chipClicked, // boolean | null (sendes fra UI)
    } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
    const facts = loadFile(FACTS_PATH);

    const openAiMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
      },
      ...messages,
    ];

    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserText = userMessages.at(-1)?.content ?? "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "";

    // ── PASSIV OBSERVABILITY ──
    const evaluatorPresent = Boolean(data.evaluator);
    const chipsPresent =
      Array.isArray(data.evaluator?.chips) &&
      data.evaluator.chips.length > 0;

    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: userMessages.length,
      user_text: lastUserText,
      answer,
      latency_ms: Date.now() - startedAt,
      status: "ok",

      evaluator_present: evaluatorPresent,
      chips_present: chipsPresent,
      chip_clicked: chipsPresent ? Boolean(chipClicked) : null,
    };

    await writeTurnLog(logEntry);

    return res.status(200).json({
      answer,
      evaluator: data.evaluator ?? null, // uændret kontrakt
    });
  } catch (err: any) {
    const errorLog: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: req.body?.sessionId ?? "unknown",
      turn_id: -1,
      user_text: "",
      answer: "",
      latency_ms: Date.now() - startedAt,
      status: "error",

      evaluator_present: false,
      chips_present: false,
      chip_clicked: null,

      error: String(err),
    };

    await writeTurnLog(errorLog);

    return res.status(500).json({ error: "Internal server error" });
  }
}
