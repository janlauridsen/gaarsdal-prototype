import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PROMPT_PATH = path.join(process.cwd(), "chatbot/evaluator.md");

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
      temperature: 0.3,
      messages,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
  const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);

  // 1. JAN – RAW
  const jan_raw = await callOpenAI([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  // 2. EVALUATOR
  const evaluator = await callOpenAI([
    { role: "system", content: evaluatorPrompt },
    {
      role: "user",
      content:
        "DIALOG:\n\n" +
        messages
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n") +
        "\n\nJAN-SVAR:\n" +
        jan_raw,
    },
  ]);

  // 3. JAN – FINAL (reshape via evaluator)
  const final = await callOpenAI([
    {
      role: "system",
      content:
        systemPrompt +
        "\n\n---\n\nDu får nedenfor en evaluator-vurdering. " +
        "Brug den til at forbedre dit svar uden at nævne evalueringen.",
    },
    {
      role: "user",
      content:
        "ORIGINALT SVAR:\n" +
        jan_raw +
        "\n\nEVALUATOR:\n" +
        evaluator,
    },
  ]);

  // 🔒 STABIL KONTRAKT
  res.status(200).json({
    jan_raw,
    evaluator,
    final,
  });
}
