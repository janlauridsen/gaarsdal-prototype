import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const JAN_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "chatbot/prompt.md"),
  "utf8"
);

const EVALUATOR_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "chatbot/evaluator.md"),
  "utf8"
);

const RESHAPE_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "chatbot/reshape.md"),
  "utf8"
);

const FACTS = fs.readFileSync(
  path.join(process.cwd(), "chatbot/fakta-gaarsdal.md"),
  "utf8"
);

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
  if (req.method !== "POST") return res.status(405).end();

  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  /* ---------- STEP 1: JAN (RAW) ---------- */
  const janRaw = await callOpenAI([
    {
      role: "system",
      content: `${JAN_PROMPT}\n\n---\n\nAUTORISERET VIDEN:\n${FACTS}`,
    },
    ...messages,
  ]);

  /* ---------- STEP 2: EVALUATOR ---------- */
  const evaluatorOutput = await callOpenAI([
    {
      role: "system",
      content: EVALUATOR_PROMPT,
    },
    {
      role: "user",
      content: `DIALOG:\n${messages
        .map((m: any) => `${m.role}: ${m.content}`)
        .join("\n")}\n\nJAN_SVAR:\n${janRaw}`,
    },
  ]);

  /* ---------- STEP 3: RESHAPE ---------- */
  const finalAnswer = await callOpenAI([
    {
      role: "system",
      content: RESHAPE_PROMPT,
    },
    {
      role: "user",
      content: JSON.stringify({
        original_answer: janRaw,
        evaluator: evaluatorOutput,
      }),
    },
  ]);

  res.status(200).json({ answer: finalAnswer });
}
