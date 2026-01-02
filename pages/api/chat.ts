import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const PRIMARY_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "chatbot", "prompt.md"),
  "utf8"
);

const VALIDATOR_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "chatbot", "validator-prompt.md"),
  "utf8"
);

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

  try {
    // ---------- PHASE 1 ----------
    const phase1 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: PRIMARY_PROMPT },
          {
            role: "user",
            content: `
DIALOG INDEN NU:
${contextReplay || "—"}

BRUGER:
${input}
`,
          },
        ],
      }),
    });

    const phase1Data = await phase1.json();
    const draft =
      phase1Data?.choices?.[0]?.message?.content?.trim() ?? "";

    // ---------- PHASE 2 ----------
    const phase2 = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: VALIDATOR_PROMPT },
          {
            role: "user",
            content: `
FUL DIALOG:
${contextReplay || "—"}

DRAFT:
${draft}
`,
          },
        ],
      }),
    });

    const phase2Data = await phase2.json();
    const finalOutput =
      phase2Data?.choices?.[0]?.message?.content?.trim() ?? draft;

    return res.status(200).json({
      output: finalOutput,
      meta: {
        engine: "2-phase",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Chat failed" });
  }
}
