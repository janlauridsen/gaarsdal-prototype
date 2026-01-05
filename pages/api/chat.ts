import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

/**
 * DEBUG MODE
 * Fast ON under lukket testforløb
 */
const DEBUG = false;

/**
 * Prompt paths
 */
const PROMPT_JAN = path.join(process.cwd(), "chatbot/prompt.md");
const PROMPT_EVALUATOR = path.join(process.cwd(), "chatbot/evaluator.md");
const PROMPT_RESHAPE = path.join(process.cwd(), "chatbot/reshape.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

/**
 * Helpers
 */
function load(p: string) {
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
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * API handler
 */
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

  /**
   * LOAD PROMPTS
   */
  const janPrompt = load(PROMPT_JAN);
  const evaluatorPrompt = load(PROMPT_EVALUATOR);
  const reshapePrompt = load(PROMPT_RESHAPE);
  const facts = load(FACTS_PATH);

  /**
   * 1. JAN – RAW
   */
  const janMessages = [
    {
      role: "system",
      content: `${janPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    ...messages,
  ];

  const janRaw = await callOpenAI(janMessages);

  /**
   * 2. EVALUATOR
   */
  const evaluatorMessages = [
    {
      role: "system",
      content: evaluatorPrompt,
    },
    {
      role: "user",
      content: `
DIALOG:
${messages
  .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
  .join("\n")}

SENESTE JAN-SVAR:
${janRaw}
`,
    },
  ];

  const evaluator = await callOpenAI(evaluatorMessages);

  /**
   * 3. RESHAPE (JAN FINAL)
   */
  const reshapeMessages = [
    {
      role: "system",
      content: reshapePrompt,
    },
    {
      role: "user",
      content: `
JAN (RAW):
${janRaw}

EVALUATOR:
${evaluator}
`,
    },
  ];

  const finalAnswer = await callOpenAI(reshapeMessages);

  /**
   * RESPONSE
   */
  if (DEBUG) {
    return res.status(200).json({
      jan_raw: janRaw,
      evaluator,
      final: finalAnswer,
      answer: finalAnswer,
      debug: true,
    });
  }

  return res.status(200).json({
    answer: finalAnswer,
  });
}
