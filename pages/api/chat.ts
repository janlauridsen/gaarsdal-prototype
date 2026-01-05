import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

/* =========================
   Paths
   ========================= */

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

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/* =========================
   API handler
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
     1. JAN (RAW)
     ===================================================== */

  const janRawMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const janRawResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: janRawMessages,
      }),
    }
  );

  const janRawData = await janRawResponse.json();
  const jan_raw =
    janRawData.choices?.[0]?.message?.content?.trim() ?? "";

  /* =====================================================
     2. EVALUATOR
     ===================================================== */

  const evaluatorMessages: ChatMessage[] = [
    { role: "system", content: evaluatorPrompt },
    {
      role: "user",
      content: `
DIALOG:
${messages
  .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}

JAN (RAW):
${jan_raw}
      `.trim(),
    },
  ];

  const evaluatorResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.0,
        messages: evaluatorMessages,
      }),
    }
  );

  const evaluatorData = await evaluatorResponse.json();
  const evaluator =
    evaluatorData.choices?.[0]?.message?.content?.trim() ?? "";

  /* =====================================================
     3. JAN (FINAL) – evaluator reshapes answer
     ===================================================== */

  const janFinalMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "assistant",
      content: `
DU HAR MODTAGET EN INTERN EVALUATOR.
BRUG DEN TIL AT JUSTERE DIT SVAR.

EVALUATOR:
${evaluator}

OPGAVE:
- Skriv ét samlet svar til brugeren
- Ingen meta, ingen evaluator-tekst
- Naturlig Jan-stemme
      `.trim(),
    },
    ...messages,
  ];

  const janFinalResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.25,
        messages: janFinalMessages,
      }),
    }
  );

  const janFinalData = await janFinalResponse.json();
  const final =
    janFinalData.choices?.[0]?.message?.content?.trim() ?? "";

  /* =====================================================
     DEBUG = ON (hard)
     ===================================================== */

  return res.status(200).json({
    answer: final, // det UI bruger
    jan_raw,
    evaluator,
    final,
    debug: true,
  });
}
