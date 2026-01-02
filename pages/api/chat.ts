import type { NextApiRequest, NextApiResponse } from "next";
import { OpenAI } from "openai";
import {
  SYSTEM_PROMPT,
  PROLOG_PROMPT,
  SUMMARY_PROMPT,
  PERSPECTIVE_PROMPT,
} from "../../chatbot/prompts";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

  // Deterministisk fase
  let phase: Phase = detectPhase(userText);

  // Prolog-garanti: altid første assistant-svar
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

  const assembled = [
    { role: "system", content: phasePrompt },
    ...messages,
  ];

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: assembled,
    temperature: 0.3,
  });

  const reply = completion.choices[0]?.message?.content ?? "";

  res.status(200).json({
    phase,
    reply,
  });
}
