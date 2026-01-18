import type { ConversationState } from "./types"

export function createInitialState(
  conversation_id: string
): ConversationState {
  return {
    conversation_id,
    revision: 0,
    active_node: "HOME",
    allowed_transitions: [
      "GEN_HYPNO",
      "TRIAGE",
      "BOOKING",
      "MAIL",
      "TLF",
      "AKUT",
    ],
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}
