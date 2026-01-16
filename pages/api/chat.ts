// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { runChatbotEngine } from "../../guided-chat/engine";
import { createSignal } from "../../guided-chat/signals";
import { createInitialSessionState } from "../../guided-chat/session/session.reducer";
import { SessionState } from "../../guided-chat/session/session.types";

/**
 * Midlertidig session store.
 * Kan senere erstattes af Redis uden UI-ændringer.
 */
const SESSIONS = new Map<string, SessionState>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { sessionId, actionId, text } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  // Hent eller opret session
  let session = SESSIONS.get(sessionId);
  if (!session) {
    session = createInitialSessionState();
    SESSIONS.set(sessionId, session);
  }

  if (!actionId && !text) {
    return res.status(400).json({ error: "Missing input" });
  }

  // 🔎 LOG – dokumentation for alle events
  console.log("[CHAT EVENT]", {
    sessionId,
    actionId: actionId ?? null,
    text: text ?? null,
    activeTaskId: session.activeTaskId,
    timestamp: new Date().toISOString(),
  });

  // Opret signal
  const signal = actionId
    ? createSignal(actionId, null, "ui")
    : createSignal("clarification", text, "ui");

  try {
    const result = runChatbotEngine(signal, session);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("[CHAT ERROR]", err);
    return res.status(500).json({ error: "Engine failure" });
  }
}
