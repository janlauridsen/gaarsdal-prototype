import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const PROMPT_PATH = path.join(process.cwd(), "chatbot", "prompt.md");
const REFLECTION_PATH = path.join(process.cwd(), "chatbot", "prompt.reflection.md");
const STATIC_INFO_PATH = path.join(process.cwd(), "chatbot", "static-info.md");

const SYSTEM_PROMPT = fs.readFileSync(PROMPT_PATH, "utf8");
const REFLECTION_PROMPT = fs.readFileSync(REFLECTION_PATH, "utf8");
const STATIC_INFO = fs.readFileSync(STATIC_INFO_PATH, "utf8");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { input, contextReplay } = req.body;

  if (!input || typeof input !== "string") {
    return res.status(400).json({ error: "Missing input" });
  }

  const userContent = [
    `[STATISK VIDEN]\n${STATIC_INFO}\n`,
    contextReplay ? `[CONTEXT]\n${contextReplay}\n` : "",
    `[BRUGER]\n${input}`,
  ].join("\n");

  try {
    // --- PHASE 1: NORMAL DIALOG ---
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!completion.ok) {
      return res.status(500).json({ error: "Upstream model error" });
    }

    const data = await completion.json();
    const mainOutput =
      data?.choices?.[0]?.message?.content?.trim() ?? "";

    // --- CHECK: OPSUMMERING ---
    const isSummary =
      input.toLowerCase().includes("opsummer");

    if (!isSummary) {
      return res.status(200).json({ output: mainOutput });
    }

    // --- PHASE 2: UDVIDET REFLEKSION ---
    const reflectionCall = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.6,
          messages: [
            { role: "system", content: REFLECTION_PROMPT },
            {
              role: "user",
              content: `OPSAMMERING:\n${mainOutput}`,
            },
          ],
        }),
      }
    );

    if (!reflectionCall.ok) {
      return res.status(200).json({ output: mainOutput });
    }

    const reflectionData = await reflectionCall.json();
    const reflectionOutput =
      reflectionData?.choices?.[0]?.message?.content?.trim() ?? "";

    return res.status(200).json({
      output: `${mainOutput}\n\n${reflectionOutput}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Chat failed" });
  }
}
