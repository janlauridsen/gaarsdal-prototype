// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { runKernel } from "../../guided-chat/kernel/engine";
import { createInitialState } from "../../guided-chat/kernel/state";
import {
  ConversationState,
  InputSignal,
} from "../../guided-chat/kernel/types";

/**
 * API = THIN FACADE
 * - No routing logic
 * - No UI logic
 * - No fallback
 * - No persistence (yet)
 */

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const {
    conversation_id,
    state,
    signal,
    startNode,
  }: {
    conversation_id: string;
    state?: ConversationState;
    signal: InputSignal;
    startNode?: string;
  } = req.body;

  if (!conversation_id || !signal) {
    return res.status(400).json({ error: "Invalid request" });
  }

  // Establish authoritative state
  const currentState: ConversationState = state
    ? state
    : createInitialState(conversation_id, startNode ?? "ROOT");

  const result = runKernel(currentState, signal);

  return res.status(200).json({
    state: result.state,
    transition: result.transition,
  });
}
