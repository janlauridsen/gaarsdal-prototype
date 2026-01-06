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
  if (req.method !== "POST") return res.status(405).end();

  const startedAt = Date.now();

  try {
    const { messages, sessionId, chipClicked } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
    const facts = loadFile(FACTS_PATH);

    const baseMessages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
      },
      ...messages,
    ];

    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserText = userMessages.at(-1)?.content ?? "";

    /* ---------- 1) JAN ---------- */
    const janRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: baseMessages,
      }),
    });

    const janData = await janRes.json();
    const answer = janData.choices?.[0]?.message?.content ?? "";

    /* ---------- 2) EVALUATOR ---------- */
    let evaluatorPresent = false;
    let chips: string[] = [];

    const evaluatorPrompt = `
Du er evaluator.
Returner KUN JSON.

Krav:
- Hvis dialogen kan forbedres med et enkelt næste fokus → foreslå op til 3 korte chips.
- Ellers returner tom liste.

Format:
{
  "chips": string[]
}
`;

    const evalRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: evaluatorPrompt },
          { role: "user", content: answer },
        ],
      }),
    });

    try {
      const evalData = await evalRes.json();
      const parsed = JSON.parse(evalData.choices?.[0]?.message?.content ?? "{}");
      if (Array.isArray(parsed.chips)) {
        evaluatorPresent = true;
        chips = parsed.chips.slice(0, 3);
      }
    } catch {
      // evaluator fejler stille – ingen user impact
    }

    /* ---------- 3) LOG ---------- */
    const logEntry: TurnLog = {
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: userMessages.length,
      user_text: lastUserText,
      answer,

      evaluator_present: evaluatorPresent,
      chips_present: chips.length > 0,
      chip_clicked:
        typeof chipClicked === "boolean" ? chipClicked : null,

      latency_ms: Date.now() - startedAt,
      status: "ok",
    };

    await writeTurnLog(logEntry);

    return res.status(200).json({
      answer,
      evaluator: evaluatorPresent ? { chips } : null,
    });
  } catch (err: any) {
    await writeTurnLog({
      timestamp: new Date().toISOString(),
      session_id: req.body?.sessionId ?? "unknown",
      turn_id: -1,
      user_text: "",
      answer: "",
      evaluator_present: false,
      chips_present: false,
      chip_clicked: null,
      latency_ms: Date.now() - startedAt,
      status: "error",
      error: String(err),
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
