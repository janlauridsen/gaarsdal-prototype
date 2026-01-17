// guided-chat/kernel/state.ts

import { ConversationState, ConversationId } from "./types";

/**
 * Create initial, total, serializable state.
 * NOTE: allowed_transitions is temporarily non-empty
 * to enable first transition testing.
 */
export function createInitialState(
  conversation_id: ConversationId,
  startNode: string
): ConversationState {
  return {
    conversation_id,
    revision: 0,
    active_node: startNode,
    allowed_transitions: ["ROOT"], // placeholder, will be data-driven later
    meta: {},
    status: "active",
  };
}
