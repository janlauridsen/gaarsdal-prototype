import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const EVALUATOR_PROMPT_PATH = path.join(process.cwd(), "chatbot/evaluator.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

// DEBUG ER FAST TIL ON I DETTE TESTFORLØB
const DEBUG = true;

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
}

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

  const { messages } = req.body as { messages: ChatMessage[] };

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages" });
  }

  const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
  const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);
  const facts = loadFile(FACTS_PATH);

  /**
   * 1) JAN – RAW
   */
  const janRawMessages: ChatMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
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
    janRawData.choices?.[0]?.message?.content ??
    "FEJL: Tomt RAW-svar";

  /**
   * 2) EVALUATOR
   */
  const evaluatorMessages: ChatMessage[] = [
    {
      role: "system",
      content: evaluatorPrompt,
    },
    {
      role: "user",
      content: jan_raw,
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
        temperature: 0.2,
        messages: evaluatorMessages,
      }),
    }
  );

  const evaluatorData = await evaluatorResponse.json();
  const evaluator =
    evaluatorData.choices?.[0]?.message?.content ??
    "[evaluator:]\nIngen evaluering.";

  /**
   * 3) JAN – FINAL (RAW + EVALUATOR → reshaped)
   */
  const janFinalMessages: ChatMessage[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}\n\n---\n\nDU FÅR NUVÆRENDE RAW-SVAR OG EVALUATOR-FEEDBACK.\nOmskriv svaret til et bedre, mere menneskeligt og mere afklaret slut-svar.\nEvaluator-hints må bruges frit.\nReturnér KUN det færdige svar.`,
    },
    {
      role: "user",
      content: `RAW:\n${jan_raw}\n\nEVALUATOR:\n${evaluator}`,
    },
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
        temperature: 0.35,
        messages: janFinalMessages,
      }),
    }
  );

  const janFinalData = await janFinalResponse.json();
  const final =
    janFinalData.choices?.[0]?.message?.content ??
    "FEJL: Tomt FINAL-svar";

  /**
   * RESPONSE TIL FRONTEND
   * Debug er altid ON her
   */
  if (DEBUG) {
    return res.status(200).json({
      jan_raw,
      evaluator,
      final,
    });
  }

  // fallback (bruges ikke pt)
  return res.status(200).json({
    answer: final,
  });
}
