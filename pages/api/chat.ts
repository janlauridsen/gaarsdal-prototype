import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const PROMPT_JAN = path.join(process.cwd(), "chatbot/prompt.md");
const PROMPT_EVALUATOR = path.join(process.cwd(), "chatbot/evaluator.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

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
      temperature: 0.3,
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

  const janPrompt = loadFile(PROMPT_JAN);
  const evaluatorPrompt = loadFile(PROMPT_EVALUATOR);
  const facts = loadFile(FACTS_PATH);

  /* ============================================================
     1. JAN – RAW
     ============================================================ */

  const janRawMessages = [
    {
      role: "system",
      content: `${janPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    ...messages,
  ];

  const jan_raw = await callOpenAI(janRawMessages);

  /* ============================================================
     2. EVALUATOR
     ============================================================ */

  const evaluatorMessages = [
    {
      role: "system",
      content: evaluatorPrompt,
    },
    {
      role: "user",
      content: `
SENESTE CHATBOT-SVAR:
${jan_raw}

SAMLET DIALOG:
${messages
  .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}
      `,
    },
  ];

  const evaluator = await callOpenAI(evaluatorMessages);

  /* ============================================================
     3. JAN – FINAL (med evaluator-hint indlejret)
     ============================================================ */

  const janFinalMessages = [
    {
      role: "system",
      content: `${janPrompt}

--- 
AUTORISERET VIDEN:
${facts}

---
EVALUATOR-FEEDBACK (META – IKKE TIL BRUGEREN):
${evaluator}

Instruktion:
- Justér dit svar ud fra evaluator-feedback
- Bevar din stemme som Jan
- Svar direkte til brugeren
- Ingen meta-kommentarer
`,
    },
    ...messages,
  ];

  const final = await callOpenAI(janFinalMessages);

  /* ============================================================
     DEBUG RESPONSE (ALTID)
     ============================================================ */

  return res.status(200).json({
    jan_raw,
    evaluator,
    final,
  });
}
