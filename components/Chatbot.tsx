import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

/* =========================
   Config
   ========================= */

const DEBUG = true; // HARD-ON som aftalt

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PROMPT_PATH = path.join(
  process.cwd(),
  "chatbot/evaluator.md"
);

/* =========================
   Helpers
   ========================= */

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
  return data?.choices?.[0]?.message?.content ?? "";
}

/* =========================
   Handler
   ========================= */

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

  /* =====================================================
     STEP 1 · JAN (RAW)
     ===================================================== */

  const janRaw = await callOpenAI([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  /* =====================================================
     STEP 2 · EVALUATOR
     ===================================================== */

  const evaluator = await callOpenAI([
    {
      role: "system",
      content: evaluatorPrompt,
    },
    {
      role: "assistant",
      content: janRaw,
    },
  ]);

  /* =====================================================
     STEP 3 · JAN (FINAL)
     Evaluator hint må påvirke formen – ikke indhold
     ===================================================== */

  const janFinal = await callOpenAI([
    {
      role: "system",
      content: systemPrompt +
        "\n\n---\n\nDu har modtaget evaluator-feedback nedenfor. " +
        "Tilpas dit svar i form og fokus, men ændr ikke grundindholdet.",
    },
    {
      role: "assistant",
      content: janRaw,
    },
    {
      role: "assistant",
      content: evaluator,
    },
  ]);

  /* =====================================================
     RESPONSE
     ===================================================== */

  if (DEBUG) {
    return res.status(200).json({
      jan_raw: janRaw,
      evaluator,
      final: janFinal,
      answer: janFinal,
    });
  }

  return res.status(200).json({
    answer: janFinal,
  });
}
