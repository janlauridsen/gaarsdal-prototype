import type { NextApiRequest, NextApiResponse } from "next";
import {
  SYSTEM_PROMPT,
  PROLOG_PROMPT,
  SUMMARY_PROMPT,
  PERSPECTIVE_PROMPT,
} from "../../chatbot/prompts";

type Phase = "PROLOG" | "DIALOG" | "SUMMARY" | "PERSPECTIVE";

function detectPhase(userText: string): Phase {
  const t = userText.toLowerCase().trim();
  if (t === "opsummer" || t === "opsummering") return "SUMMARY";
  return "DIALOG";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const { messages = [] } = req.body as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const lastUser = [...messages].reverse().find(m => m.role === "user");
  const userText = lastUser?.content ?? "";

  let phase: Phase = detectPhase(userText);

  // Prolog-garanti
  const hasAssistant = messages.some(m => m.role === "assistant");
  if (!hasAssistant) phase = "PROLOG";

  const phasePrompt =
    phase === "PROLOG"
      ? PROLOG_PROMPT
      : phase === "SUMMARY"
      ? SUMMARY_PROMPT
      : phase === "PERSPECTIVE"
      ? PERSPECTIVE_PROMPT
      : SYSTEM_PROMPT;

  const payload = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: phasePrompt },
      ...messages,
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    res.status(500).json({ error });
    return;
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "";

  res.status(200).json({
    phase,
    reply,
  });
}
