import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");
const EVALUATOR_PROMPT_PATH = path.join(process.cwd(), "chatbot/evaluator.md");

// === TEST FLAGS ===
const EVALUATOR_ENABLED = true;
const EVALUATOR_HINT_ENABLED = true;

// === IN-MEMORY HINT (TEST ONLY) ===
// Lever ét turn frem
let lastEvaluatorHint: string | null = null;

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
      temperature: 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function extractEvaluatorHint(text: string): string | null {
  const match = text.match(/\[evaluator-hint:\]([\s\S]*)$/i);
  if (!match) return null;
  return match[1].trim();
}

function stripEvaluatorHint(text: string): string {
  return text.replace(/\n*\[evaluator-hint:\][\s\S]*$/i, "").trim();
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

  const systemPrompt = loadFile(SYSTEM_PROMPT_PATH);
  const facts = loadFile(FACTS_PATH);

  // ===== JAN / CHATBOT =====
  const chatMessages: any[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
  ];

  // Indsæt evaluator-hint som system-kontekst (automatisk, ét turn)
  if (EVALUATOR_HINT_ENABLED && lastEvaluatorHint) {
    chatMessages.push({
      role: "system",
      content: `[evaluator-hint:]\n${lastEvaluatorHint}`,
    });
    lastEvaluatorHint = null; // forbruges nu
  }

  chatMessages.push(...messages);

  let chatbotAnswer = "";

  try {
    chatbotAnswer = await callOpenAI(chatMessages);
  } catch {
    return res.status(500).json({
      answer: "Der opstod en teknisk fejl. Prøv igen senere.",
    });
  }

  let finalAnswer = chatbotAnswer;

  // ===== EVALUATOR =====
  if (EVALUATOR_ENABLED) {
    try {
      const evaluatorPrompt = loadFile(EVALUATOR_PROMPT_PATH);

      const transcript = [
        ...messages,
        { role: "assistant", content: chatbotAnswer },
      ]
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const evaluatorMessages = [
        {
          role: "system",
          content: evaluatorPrompt,
        },
        {
          role: "user",
          content: transcript,
        },
      ];

      const evaluatorRaw = await callOpenAI(evaluatorMessages);

      // Udtræk evt. hint
      const hint = extractEvaluatorHint(evaluatorRaw);
      if (hint && EVALUATOR_HINT_ENABLED) {
        lastEvaluatorHint = hint;
      }

      // Fjern hint fra det, der vises i chatten
      const evaluatorVisible = stripEvaluatorHint(evaluatorRaw);

      if (evaluatorVisible && evaluatorVisible.trim()) {
        finalAnswer =
          chatbotAnswer +
          "\n\n---\n\n" +
          evaluatorVisible;
      }
    } catch {
      // Evaluator må aldrig kunne vælte chatten
      finalAnswer = chatbotAnswer;
    }
  }

  return res.status(200).json({
    answer: finalAnswer,
  });
}
