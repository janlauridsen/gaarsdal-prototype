import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

/* ---------- LOAD PROMPTS ---------- */

const PROMPT_JAN = fs.readFileSync(
  path.join(process.cwd(), "chatbot/prompt.md"),
  "utf8"
);

const PROMPT_EVALUATOR = fs.readFileSync(
  path.join(process.cwd(), "chatbot/evaluator.md"),
  "utf8"
);

const PROMPT_RESHAPE = fs.readFileSync(
  path.join(process.cwd(), "chatbot/reshape.md"),
  "utf8"
);

const FACTS = fs.readFileSync(
  path.join(process.cwd(), "chatbot/fakta-gaarsdal.md"),
  "utf8"
);

/* ---------- OPENAI CALL ---------- */

async function callOpenAI(messages: any[], temperature = 0.3) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
      messages,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/* ---------- API HANDLER ---------- */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { messages, debug } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  try {
    /* ---------- STEP 1: JAN (RAW) ---------- */

    const janRaw = await callOpenAI(
      [
        {
          role: "system",
          content: `${PROMPT_JAN}\n\n---\n\nAUTORISERET VIDEN:\n${FACTS}`,
        },
        ...messages,
      ],
      0.35
    );

    /* ---------- STEP 2: EVALUATOR ---------- */

    const evaluator = await callOpenAI(
      [
        { role: "system", content: PROMPT_EVALUATOR },
        {
          role: "user",
          content: `DIALOG:\n${messages
            .map((m: any) => `${m.role}: ${m.content}`)
            .join("\n")}\n\nJAN_SVAR:\n${janRaw}`,
        },
      ],
      0.2
    );

    /* ---------- STEP 3: RESHAPE ---------- */

    const finalAnswer = await callOpenAI(
      [
        { role: "system", content: PROMPT_RESHAPE },
        {
          role: "user",
          content: JSON.stringify({
            jan_raw: janRaw,
            evaluator,
          }),
        },
      ],
      0.35
    );

    /* ---------- RESPONSE ---------- */

    if (debug) {
      return res.status(200).json({
        jan_raw: janRaw,
        evaluator,
        final: finalAnswer,
      });
    }

    return res.status(200).json({
      answer: finalAnswer,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Chatbot error",
    });
  }
}
