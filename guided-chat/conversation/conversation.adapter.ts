// guided-chat/conversation/conversation.adapter.ts

import { ConversationState } from "./conversation.state";

/**
 * Read-only adapter.
 * Mapper eksisterende session-form til ConversationState.
 * Ingen mutation. Ingen default-logik.
 */
export function projectToConversationState(input: {
  session_id: string;
  revision?: number;
  active_node?: string;
  allowed_transitions?: string[];
  meta?: Record<string, unknown>;
  status?: string;
}): ConversationState {
  return {
    conversation_id: input.session_id,
    revision: input.revision ?? 0,
    active_node: input.active_node ?? "ROOT",
    allowed_transitions: input.allowed_transitions ?? [],
    meta: input.meta ?? {},
    status:
      input.status === "paused" ||
      input.status === "completed" ||
      input.status === "rejected"
        ? input.status
        : "active",
  };
}
