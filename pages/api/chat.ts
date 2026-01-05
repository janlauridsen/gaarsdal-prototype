import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

/**
 * DEBUG ER FAST TIL ON
 * Ingen env-variabel.
 * Ingen toggles.
 */
const DEBUG = true;

/**
 * Prompt paths
 */
const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");
const EVALUATOR_PATH = path.join(process.cwd(), "chatbot/evaluator.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

/**
 * Type guards
 */
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { messages } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages payload" });
  }

  const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
  const facts = loadFile(FACTS_PATH);
  const evaluatorPrompt = loadFile(EVALUATOR_PATH);

  /**
   * 1. JAN (RAW)
   */
  const janRawMessages: ChatMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    ...messages,
  ];

  const rawResponse = await fetch(
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

  const rawData = await rawResponse.json();
  const janRaw =
    rawData?.choices?.[0]?.message?.content ??
    "FEJL: Ingen RAW-respons";

  /**
   * 2. EVALUATOR
   * Evaluator får:
   * - seneste brugerinput
   * - Jan RAW
   */
  const evaluatorMessages: ChatMessage[] = [
    {
      role: "system",
      content: evaluatorPrompt,
    },
    {
      role: "user",
      content:
        "SENESTE BRUGERINPUT:\n" +
        messages[messages.length - 1]?.content,
    },
    {
      role: "assistant",
      content: "JAN (RAW):\n" + janRaw,
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
        temperature: 0,
        messages: evaluatorMessages,
      }),
    }
  );

  const evaluatorData = await evaluatorResponse.json();
  const evaluator =
    evaluatorData?.choices?.[0]?.message?.content ??
    "[evaluator:]\nFEJL: Ingen evaluator-output";

  /**
   * 3. JAN (FINAL)
   * Jan får RAW + evaluator-output og skal reshapes
   */
  const janFinalMessages: ChatMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    {
      role: "assistant",
      content: "JAN (RAW):\n" + janRaw,
    },
    {
      role: "assistant",
      content: "EVALUATOR:\n" + evaluator,
    },
    {
      role: "user",
      content:
        "Omskriv nu svaret til ét samlet, naturligt Jan-svar til brugeren.\n" +
        "Indarbejd evaluatorens pointer hvis relevante.\n" +
        "Vis IKKE evaluator eller meta.",
    },
  ];

  const finalResponse = await fetch(
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

  const finalData = await finalResponse.json();
  const janFinal =
    finalData?.choices?.[0]?.message?.content ??
    "FEJL: Ingen FINAL-respons";

  /**
   * 4. SVAR TIL FRONTEND
   * DEBUG = ON → returnér alt
   */
  if (DEBUG) {
    return res.status(200).json({
      jan_raw: janRaw,
      evaluator,
      final: janFinal,
    });
  }

  /**
   * (Ikke i brug lige nu)
   */
  return res.status(200).json({
    answer: janFinal,
  });
}
