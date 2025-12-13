// pages/api/ai-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Missing messages" });
  }

  const userMessages: ChatMessage[] = body.messages;

  // System prompt / personality - tilpasset hypnoterapi-assistent (ikke-behandlende)
  const systemPrompt = `
Du er "Jans Assistent" — en venlig, faglig og empatisk hjælper for besøgende på en hjemmeside om hypnoterapi.
Hold tonen professionel og forstående.
Du må aldrig give medicinske diagnoser eller psykologisk behandling.
Ved tvivl, opfordr til at kontakte behandleren (link til kontakt) eller søge professionel hjælp.
Kort og klare svar (1-3 korte afsnit) er foretrukket. Hvis brugeren stiller spørgsmål om behandlingsanbefaling, svar med saglig information relateret til hypnoseterapi og henvis til kontakt.
Svar på dansk.
`;

  // Compose messages for OpenAI
  const messages = [
    { role: "system", content: systemPrompt },
    // Append the user's messages
    ...userMessages,
  ];

  try {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key on server" });
    }

    const payload = {
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.2,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI error:", resp.status, text);
      return res.status(502).json({ error: "OpenAI API error", details: text });
    }

    const data = await resp.json();
    const assistantReply = data?.choices?.[0]?.message?.content ?? "";

    return res.status(200).json({ reply: assistantReply });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error", details: err.message ?? String(err) });
  }
}
