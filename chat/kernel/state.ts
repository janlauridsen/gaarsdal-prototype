// chat/kernel/state.ts

import {
  ConversationId,
  ConversationState,
  ConversationStatus,
  NodeId,
  MetaStore,
} from "./types";

/**
 * Opret ny conversation state.
 * Dette er den ENESTE tilladte entry til en ny samtale.
 */
export function createInitialState(params: {
  conversation_id: ConversationId;
  start_node: NodeId;
  allowed_transitions: NodeId[];
}): ConversationState {
  return {
    conversation_id: params.conversation_id,
    revision: 0,
    active_node: params.start_node,
    allowed_transitions: params.allowed_transitions,
    meta: {},
    status: "active",
  };
}

/**
 * Invariant-validering.
 * Skal kaldes efter HVER state-ændring.
 */
export function assertValidState(state: ConversationState): void {
  if (!state.conversation_id) {
    throw new Error("State invariant violated: missing conversation_id");
  }

  if (state.revision < 0) {
    throw new Error("State invariant violated: negative revision");
  }

  if (!state.active_node) {
    throw new Error("State invariant violated: missing active_node");
  }

  if (!Array.isArray(state.allowed_transitions)) {
    throw new Error("State invariant violated: allowed_transitions must be array");
  }

  if (typeof state.meta !== "object") {
    throw new Error("State invariant violated: meta must be object");
  }

  if (!isValidStatus(state.status)) {
    throw new Error("State invariant violated: invalid status");
  }
}

/**
 * Intern status-guard
 */
function isValidStatus(
  status: ConversationStatus
): status is ConversationStatus {
  return (
    status === "active" ||
    status === "paused" ||
    status === "completed" ||
    status === "rejected"
  );
}
