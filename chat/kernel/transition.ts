// chat/kernel/transition.ts

import {
  ConversationState,
  Transition,
  TransitionType,
  NodeId,
} from "./types";

import { assertValidState } from "./state";

/**
 * Anvend en transition på state.
 * Dette er den ENESTE tilladte måde at ændre state på.
 */
export function applyTransition(
  state: ConversationState,
  transition: Transition
): ConversationState {
  // Basal validering
  if (transition.from !== state.active_node) {
    throw new Error(
      `Invalid transition: from=${transition.from} does not match active_node=${state.active_node}`
    );
  }

  if (!isAllowedTransitionType(transition.type)) {
    throw new Error(`Invalid transition type: ${transition.type}`);
  }

  // Rejection ændrer ikke state (kontrakt)
  if (transition.type === "REJECT") {
    return state;
  }

  const nextState: ConversationState = {
    ...state,
    revision: state.revision + 1,
    active_node: transition.to ?? state.active_node,
  };

  // Terminal transitions lukker samtalen
  if (transition.type === "TERMINAL") {
    nextState.status = "completed";
  }

  assertValidState(nextState);
  return nextState;
}

/**
 * Intern type-guard
 */
function isAllowedTransitionType(
  type: TransitionType
): type is TransitionType {
  return (
    type === "NODE_HOP" ||
    type === "PARENTESE_OPEN" ||
    type === "PARENTESE_CLOSE" ||
    type === "TERMINAL" ||
    type === "REJECT"
  );
}
