import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "chatbot/prompt.md");
const FACTS_PATH = path.join(process.cwd(), "chatbot/fakta-gaarsdal.md");

function loadFile(p: string) {
  return fs.readFileSync(p, "utf8");
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

  const openAiMessages = [
    {
      role: "system",
      content: `${systemPrompt}\n\n---\n\nAUTORISERET VIDEN:\n${facts}`,
    },
    ...messages,
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: openAiMessages,
      response_format: { type: "json_object" },
    }),
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content;

  if (!raw) {
    return res.status(200).json({
      intent: "dialog",
      response: "Jeg mistede kortvarigt forbindelsen. Vil du gentage det sidste?",
    });
  }

  try {
    const parsed = JSON.parse(raw);

    // Minimal validering
    if (
      typeof parsed.intent === "string" &&
      typeof parsed.response === "string"
    ) {
      return res.status(200).json(parsed);
    }

    throw new Error("Invalid shape");
  } catch (err) {
    console.error("⚠️ Model returned invalid JSON:", raw);

    return res.status(200).json({
      intent: "dialog",
      response:
        "Jeg vil gerne være sikker på, at jeg forstår dig rigtigt. Kan du uddybe det sidste lidt?",
    });
  }
}
