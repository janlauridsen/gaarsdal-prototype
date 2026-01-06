import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";

// Paths
const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");
const EVALUATOR_PROMPT_PATH = path.join(process.cwd(), "chatbot/evaluator.md");

// Utils
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
    const { messages, sessionId } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
    const facts = loadFile(FACTS_PATH);
    const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);

    /* =========================
       1. PRIMARY CHAT RESPONSE
       ========================= */

    const openAiMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
      },
      ...messages,
    ];

    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserText = userMessages.at(-1)?.content ?? "";

    const chatResponse = await fetch(
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
      }
    );

    const chatData = await chatResponse.json();
    const answer = chatData.choices?.[0]?.message?.content ?? "";

    /* =========================
       2. EVALUATOR PASS (RAW)
       ========================= */

    let evaluatorHints: string[] | null = null;
    let evaluatorPresent = false;

    try {
      const evaluatorMessages = [
        {
          role: "system",
          content: evaluatorPrompt,
        },
        {
          role: "user",
          content:
            "DIALOG:\n\n" +
            messages
              .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
              .join("\n\n") +
            `\n\nCHATBOT_SVAR:\n${answer}`,
        },
      ];

      const evaluatorResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: evaluatorMessages,
          }),
        }
      );

      const evaluatorData = await evaluatorResponse.json();
      const evaluatorText =
        evaluatorData.choices?.[0]?.message?.content ?? "";

      evaluatorPresent = true;

      // MEGET bevidst: ingen parsing ud over linje-split
      evaluatorHints = evaluatorText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } catch {
      evaluatorPresent = false;
      evaluatorHints = null;
    }

    /* =========================
       3. LOGGING (TURN)
       ========================= */

    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: userMessages.length,
      user_text: lastUserText,
      answer,
      latency_ms: Date.now() - startedAt,
      status: "ok",

      evaluator_present: evaluatorPresent,
      chips_present: evaluatorHints ? evaluatorHints.length > 0 : false,
      chip_clicked: null,

      evaluator_hints: evaluatorHints,
    };

    await writeTurnLog(logEntry);

    /* =========================
       4. RESPONSE TO UI
       ========================= */

    return res.status(200).json({
      answer,
      evaluator: evaluatorHints
        ? { hints: evaluatorHints }
        : null,
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
    };

    await writeTurnLog(errorLog);

    return res.status(500).json({ error: "Internal server error" });
  }
}
