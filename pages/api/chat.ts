import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { writeTurnLog } from "../../chatbot/logWriter";

// Paths
const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

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

  const startTime = Date.now();

  try {
    const { messages, sessionId } = req.body;

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
    const lastUserMessage = userMessages.at(-1)?.content ?? "";

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

    // LOG – SUCCESS
    writeTurnLog({
      timestamp: new Date().toISOString(),
      session_id: sessionId ?? "unknown",
      turn_id: userMessages.length, // ✅ rettet felt
      model: "gpt-4o-mini",
      user_text: lastUserMessage,
      answer,
      latency_ms: Date.now() - startTime,
      status: "ok",
    });

    return res.status(200).json({ answer });
  } catch (err: any) {
    // LOG – ERROR
    writeTurnLog({
      timestamp: new Date().toISOString(),
      session_id: req.body?.sessionId ?? "unknown",
      turn_id: -1, // ✅ rettet felt
      model: "gpt-4o-mini",
      user_text: "",
      answer: "",
      latency_ms: Date.now() - startTime,
      status: "error",
      error: String(err),
    });

    return res.status(500).json({ error: "Internal server error" });
  }
}
