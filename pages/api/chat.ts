// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { runChatbotEngine } from "../../guided-chat/engine";
import {
  createInitialSessionState,
  restoreSessionState,
} from "../../guided-chat/session/session.factory";

import { writeTurnLog } from "../../guided-chat/logging/logWriter";
import { TurnLog } from "../../guided-chat/logging/log.types";

/* =====================
   API HANDLER
===================== */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const startedAt = Date.now();

  const {
    sessionId,
    input,
  }: {
    sessionId?: string;
    input?: {
      text?: string;
      chip?: string;
      action?: string;
    };
  } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  /* =====================
     SESSION
  ===================== */

  // Stateless fallback. Redis kan senere kobles på her.
  const session =
    restoreSessionState(sessionId) ??
    createInitialSessionState(sessionId);

  /* =====================
     ENGINE
  ===================== */

  const engineResult = runChatbotEngine({
    session,
    input: input ?? {},
  });

  /* =====================
     LOGGING (TURN)
  ===================== */

  const logEntry: TurnLog = {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    node_from: engineResult.nodeFrom ?? null,
    node_to: engineResult.nodeTo ?? null,
    raw_text: input?.text ?? null,
    chip_explicit: input?.chip ?? null,
    signal: engineResult.signal ?? null,
    action: engineResult.action ?? null,
    latency_ms: Date.now() - startedAt,
  };

  await writeTurnLog(logEntry);

  /* =====================
     RESPONSE
  ===================== */

  return res.status(200).json({
    node: engineResult.nodeTo,
    message: engineResult.message,
    chips: engineResult.chips ?? [],
  });
}
