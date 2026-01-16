// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { runChatbotEngine } from "../../guided-chat/engine";
import { createSignal } from "../../guided-chat/signals";
import { createInitialSessionState } from "../../guided-chat/session/session.reducer";

/**
 * Midlertidig in-memory session store.
 * (kan senere erstattes af Redis uden UI-ændringer)
 */
const SESSIONS = new Map<string, any>();

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

  if (!actionId && !text) {
    return res.status(400).json({ error: "Missing input" });
  }

  const session =
    SESSIONS.get(sessionId) ?? createInitialSessionState();

  let signal;

  if (actionId) {
    signal = createSignal(actionId, null, "ui");
  } else {
    signal = createSignal("clarification", text, "ui");
  }

  const result = runChatbotEngine(signal, session);

  SESSIONS.set(sessionId, session);

  return res.status(200).json(result);
}
