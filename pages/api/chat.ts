import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");
const EVALUATOR_PROMPT_PATH = path.join(
  process.cwd(),
  "chatbot/evaluator.md"
);
const RESHAPE_PROMPT_PATH = path.join(
  process.cwd(),
  "chatbot/reshape.md"
);

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

async function callOpenAI(messages: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages,
    }),
  });

  const data = await response.json();
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

  // DEBUG ER ALTID ON I DETTE FORLØB
  const debug = true;

  const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
  const facts = loadFile(FACTS_PATH);
  const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);
  const reshapePrompt = loadFile(RESHAPE_PROMPT_PATH);

  /* -----------------------------
     1. JAN (RAW)
     ----------------------------- */
  const janRawMessages = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    ...messages,
  ];

  const jan_raw = await callOpenAI(janRawMessages);

  /* -----------------------------
     2. EVALUATOR
     ----------------------------- */
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
          .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n\n") +
        `\n\nJAN (RAW):\n${jan_raw}`,
    },
  ];

  const evaluator = await callOpenAI(evaluatorMessages);

  /* -----------------------------
     3. JAN (FINAL / RESHAPED)
     ----------------------------- */
  const reshapeMessages = [
    {
      role: "system",
      content: reshapePrompt,
    },
    {
      role: "user",
      content: `JAN (RAW):\n${jan_raw}\n\nEVALUATOR:\n${evaluator}`,
    },
  ];

  const final = await callOpenAI(reshapeMessages);

  /* -----------------------------
     RESPONSE
     ----------------------------- */
  if (debug) {
    return res.status(200).json({
      jan_raw,
      evaluator,
      final,
    });
  }

  return res.status(200).json({
    answer: final,
  });
}
