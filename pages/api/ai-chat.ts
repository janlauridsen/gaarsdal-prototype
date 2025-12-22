// pages/api/ai-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import screeningPrompt from "../../prompts/screening-v3";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Missing messages" });
  }

  const incomingMessages: ChatMessage[] = body.messages;

  /**
   * 🔒 KRITISK:
   * Vi sender KUN user-beskeder videre til modellen.
   * UI-assistant-beskeder (fx "Hej — jeg er Gaarsdal Assistent")
   * må ALDRIG påvirke modellen.
   */
  const userMessages: ChatMessage[] = incomingMessages.filter(
    (m) => m.role === "user"
  );

  /**
   * 🧠 SAMLET MESSAGE-STACK
   * System prompt skal ALTID være først.
   */
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: screeningPrompt,
    },
    ...userMessages,
  ];

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res
        .status(500)
        .json({ error: "Missing OpenAI API key on server" });
    }

    const payload = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.2,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI error:", resp.status, text);
      return res
        .status(502)
        .json({ error: "OpenAI API error", details: text });
    }

    const data = await resp.json();
    const assistantReply =
      data?.choices?.[0]?.message?.content ?? "";

    return res.status(200).json({ reply: assistantReply });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
