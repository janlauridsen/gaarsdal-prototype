import type { NextApiRequest, NextApiResponse } from "next";
import screeningPrompt from "../../prompts/screening-v4";
import { getOrCreateSessionId } from "../../lib/session";
import {
  logSessionMeta,
  logSessionTurn,
  finalizeSession,
  ChatState,
} from "../../lib/session-logger";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Missing messages" });
  }

  /* ----------------------------------
     SESSION IDENTITET
  ---------------------------------- */
  const sessionId = getOrCreateSessionId(req, res);

  const stateBefore: ChatState = body.state ?? "welcome";

  /* ----------------------------------
     HARD STOP EFTER LUKNING
  ---------------------------------- */
  if (stateBefore === "closed") {
    return res.status(200).json({
      reply:
        "Screeningen er afsluttet og kan kun afklare relevansen af hypnoterapi for den beskrevne problemstilling.",
    });
  }

  /* ----------------------------------
     SESSION META (idempotent)
  ---------------------------------- */
  await logSessionMeta({
    sessionId,
    startedAt: new Date().toISOString(),
    model: "gpt-4o-mini",
    promptVersion: "screening-v4.4",
    environment: process.env.NODE_ENV === "production" ? "prod" : "dev",
  });

  /* ----------------------------------
     MESSAGE STACK (KUN USER)
  ---------------------------------- */
  const incomingMessages: ChatMessage[] = body.messages;

  const userMessages: ChatMessage[] = incomingMessages.filter(
    (m) => m.role === "user"
  );

  const messages: ChatMessage[] = [
    { role: "system", content: screeningPrompt },
    ...userMessages,
  ];

  try {
    /* ----------------------------------
       OPENAI KALD
    ---------------------------------- */
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 300,
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`OpenAI error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    const assistantText: string =
      data?.choices?.[0]?.message?.content ?? "";

    /* ----------------------------------
       AFGØR LUKNING
    ---------------------------------- */
    const isClosing =
      assistantText.trim().startsWith(
        "Ud fra det, du har beskrevet, er det primært afklaret, at"
      ) ||
      assistantText.includes(
        "Denne vurdering vedrører kun den beskrevne problemstilling"
      );

    const stateAfter: ChatState = isClosing ? "closed" : "screening";

    /* ----------------------------------
       LOG TURN (APPEND-ONLY)
    ---------------------------------- */
    await logSessionTurn({
      sessionId,
      turnIndex: userMessages.length - 1,
      userText: userMessages[userMessages.length - 1]?.content ?? "",
      assistantText,
      chatStateBefore: stateBefore,
      chatStateAfter: stateAfter,
      isClosing,
      timestamp: new Date().toISOString(),
    });

    /* ----------------------------------
       FINALISÉR SESSION
    ---------------------------------- */
    if (isClosing) {
      await finalizeSession(sessionId, "concluded");
    }

    return res.status(200).json({ reply: assistantText });
  } catch (err: any) {
    await finalizeSession(sessionId, "error");

    console.error("AI chat error:", err);

    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
