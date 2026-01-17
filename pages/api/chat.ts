// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";

import { runKernel } from "../../guided-chat/kernel/engine";
import { createInitialState } from "../../guided-chat/kernel/state";
import {
  ConversationState,
  InputSignal,
} from "../../guided-chat/kernel/types";

import { writeKernelLog } from "../../guided-chat/logging/logWriter";

/**
 * API = THIN FACADE + PASSIVE LOGGING
 */

export default async function handler(
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

  const currentState: ConversationState = state
    ? state
    : createInitialState(conversation_id, startNode ?? "ROOT");

  const result = runKernel(currentState, signal);

  await writeKernelLog({
    conversation_id,
    revision_before: currentState.revision,
    revision_after: result.state.revision,
    active_node_before: currentState.active_node,
    active_node_after: result.state.active_node,
    input_type: signal.type,
    transition_type: result.transition.type,
    timestamp: new Date().toISOString(),
  });

  return res.status(200).json({
    state: result.state,
    transition: result.transition,
  });
}
