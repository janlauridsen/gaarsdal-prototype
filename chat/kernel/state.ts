import type { ConversationState } from "./types"
import { getNode } from "../nodes/registry"

export function createInitialState(
  conversation_id: string
): ConversationState {
  const home = getNode("HOME")

  return {
    conversation_id,
    revision: 0,
    active_node: home.id,
    active_node_message: home.message,
    allowed_transitions: home.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}
