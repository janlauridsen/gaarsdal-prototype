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
 * Creates the "lobby" state used for profile/thread bootstrap before entering a specific thread.
 * This state is intentionally separate from regular thread conversations.
 */
export function createLobbyState(conversation_id: string): ConversationState {
  const bootstrap = getNode("PROFILE_BOOTSTRAP")

  return {
    conversation_id,
    revision: 0,
    active_node: bootstrap.id,
    active_node_message: bootstrap.message,
    allowed_transitions: bootstrap.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}
