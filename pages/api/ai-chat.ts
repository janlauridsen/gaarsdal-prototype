import type { NextApiRequest, NextApiResponse } from "next";
import screeningPrompt from "../../prompts/screening-v4";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatState = "welcome" | "orienting" | "screening" | "closed";

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

  const state: ChatState = body.state ?? "welcome";

  if (state === "closed") {
    return res.status(200).json({
      reply:
        "Screeningen er afsluttet og kan kun afklare relevansen af hypnoterapi for den beskrevne problemstilling.",
    });
  }

  const userMessages = body.messages.filter(
    (m: ChatMessage) => m.role === "user"
  );

  const messages: ChatMessage[] = [
    { role: "system", content: screeningPrompt },
    ...userMessages,
  ];

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    return res.status(200).json({ reply });
  } catch (err: any) {
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
