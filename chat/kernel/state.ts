import {
  ConversationId,
  ConversationState,
  NodeId,
} from "./types";

/**
 * STATE-FABRIK
 * Ren data. Ingen logik.
 */

export function createInitialState(
  conversation_id: ConversationId,
  start_node: NodeId,
  allowed_transitions: NodeId[]
): ConversationState {
  return {
    conversation_id,
    revision: 0,
    active_node: start_node,
    allowed_transitions,
    meta: {},
    status: "active",
  };
}
