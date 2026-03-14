import type { ConversationState } from "./types"
import { getNode } from "../nodes/registry"

export function createInitialState(
  conversation_id: string
): ConversationState {
  const entry = getNode("GEN_HYPNO")

  return {
    conversation_id,
    revision: 0,
    active_node: entry.id,
    active_node_message: entry.message,
    allowed_transitions: entry.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}

/**
 * Creates the "lobby" state used before entering a specific thread.
 * The lobby must point to an existing node in the current registry.
 */
export function createLobbyState(conversation_id: string): ConversationState {
  const entry = getNode("HOME")

  return {
    conversation_id,
    revision: 0,
    active_node: entry.id,
    active_node_message: entry.message,
    allowed_transitions: entry.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}
