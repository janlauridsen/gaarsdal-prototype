// Chatbot API · PRISM v0.3
// Mode: Flat prompt · Stateless with optional replay
// Status: Production baseline

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

// --- Load PRISM prompt (system message) ---
const PROMPT_PATH = path.join(process.cwd(), "chatbot", "prompt.md");

const SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, "utf8");

// --- API handler ---
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

  // Build user message with optional replay
  const userContent = [
    contextReplay
      ? `[CONTEXT REPLAY]\n${contextReplay}\n`
      : "",
    `[USER INPUT]\n${input}`,
  ].join("\n");

  try {
    const completion = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.7,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT.replace(
                "MODE: {PRODUCT | LAB}",
                `MODE: ${effectiveMode}`
              ),
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      }
    );

    if (!completion.ok) {
      const text = await completion.text();
      console.error("OpenAI error:", text);
      return res.status(500).json({ error: "Upstream model error" });
    }

    const data = await completion.json();

    const output =
      data?.choices?.[0]?.message?.content?.trim() ?? "";

    return res.status(200).json({
      output,
      meta: {
        mode: effectiveMode,
        engine: "PRISM v0.3",
      },
    });
  } catch (err) {
    console.error("Chat API failed:", err);
    return res.status(500).json({ error: "Chat failed" });
  }
}
