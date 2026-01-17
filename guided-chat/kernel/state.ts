// guided-chat/kernel/state.ts

import { ConversationState, ConversationId } from "./types";

export function createInitialState(
  conversation_id: ConversationId,
  startNode: string
): ConversationState {
  return {
    conversation_id,
    revision: 0,
    active_node: startNode,
    meta: {},
    status: "active",
  };
}
