// Chatbot API · PRISM v0.4
// Mode: 2-phase prompt · Stateless with replay
// Status: Chatbot optimization baseline

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// -------- Load prompts --------
const PROMPT_PHASE1_PATH = path.join(process.cwd(), "chatbot", "prompt.md");
const PROMPT_PHASE2_PATH = path.join(
  process.cwd(),
  "chatbot",
  "prompt-phase2.md"
);

const STATIC_INFO_PATH = path.join(
  process.cwd(),
  "chatbot",
  "static-info.md"
);

const PROMPT_PHASE1 = fs.readFileSync(PROMPT_PHASE1_PATH, "utf8");
const PROMPT_PHASE2 = fs.readFileSync(PROMPT_PHASE2_PATH, "utf8");
const STATIC_INFO = fs.readFileSync(STATIC_INFO_PATH, "utf8");

// -------- Helper: call OpenAI --------
async function callOpenAI(messages: any[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() ?? "";
}

// -------- API handler --------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { input, contextReplay, mode } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Missing input" });
  }

  const effectiveMode =
    mode === "LAB" || mode === "PRODUCT" ? mode : "PRODUCT";

  try {
    // -------- PHASE 1: Raw answer --------
    const phase1UserContent = [
      `[STATISK VIDEN]\n${STATIC_INFO}\n`,
      contextReplay ? `[CONTEXT REPLAY]\n${contextReplay}\n` : "",
      `[USER INPUT]\n${input}`,
    ].join("\n");

    const draftAnswer = await callOpenAI([
      {
        role: "system",
        content: PROMPT_PHASE1.replace(
          "MODE: {PRODUCT | LAB}",
          `MODE: ${effectiveMode}`
        ),
      },
      {
        role: "user",
        content: phase1UserContent,
      },
    ]);

    // -------- PHASE 2: Normalize & validate --------
    const phase2Input = `
SESSION CONTEXT:
${contextReplay || "—"}

RAW ANSWER:
${draftAnswer}
`;

    const finalAnswer = await callOpenAI([
      {
        role: "system",
        content: PROMPT_PHASE2,
      },
      {
        role: "user",
        content: phase2Input,
      },
    ]);

    return res.status(200).json({
      output: finalAnswer || draftAnswer,
      meta: {
        engine: "PRISM v0.4 · 2-phase",
        mode: effectiveMode,
      },
    });
  } catch (err) {
    console.error("Chat API failed:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
}
