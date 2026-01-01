// /chatbot/api/chat.ts
// Chatbot v0 · Flat prompt API
// Status: Experimental · Value-first

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const PROMPT_PATH = path.join(
  process.cwd(),
  "chatbot",
  "prompt.md"
);

const SYSTEM_PROMPT = fs.readFileSync(
  PROMPT_PATH,
  "utf8"
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { input } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      error: "Missing input",
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing");
    return res.status(500).json({
      error: "Server misconfigured",
    });
  }

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
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: input,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!completion.ok) {
      const errText = await completion.text();
      console.error(
        "OpenAI API error:",
        completion.status,
        errText
      );
      return res.status(500).json({
        error: "OpenAI API error",
      });
    }

    const data = await completion.json();

    const rawOutput =
      data?.choices?.[0]?.message?.content ?? "";

    const output = rawOutput
      .replace(/du bør/gi, "du kunne overveje")
      .replace(/du skal/gi, "det kan være relevant at")
      .trim();

    return res.status(200).json({
      output,
      meta: {
        mode: "flat-chatbot-v0",
        note:
          "Foreløbig refleksion – ikke rådgivning.",
      },
    });
  } catch (err) {
    console.error("Chat failed:", err);
    return res.status(500).json({
      error: "Chat failed",
    });
  }
}
