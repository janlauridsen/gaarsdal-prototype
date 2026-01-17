// guided-chat/kernel/engine.ts

import {
  ConversationState,
  InputSignal,
  Transition,
} from "./types";

/**
 * PURE KERNEL ENGINE
 *
 * Implements exactly one real rule:
 * - EXPLICIT_TRANSITION to allowed node
 * Everything else is rejected.
 */
export function runKernel(
  state: ConversationState,
  input: InputSignal
): { state: ConversationState; transition: Transition } {
  // Only explicit transitions are supported at this stage
  if (input.type !== "EXPLICIT_TRANSITION") {
    return {
      state,
      transition: {
        type: "REJECT",
        from: state.active_node,
        reason: "Unsupported input signal",
      },
    };
  }

  // Validate against allowed transitions
  if (!state.allowed_transitions.includes(input.target)) {
    return {
      state,
      transition: {
        type: "REJECT",
        from: state.active_node,
        to: input.target,
        reason: "Target not allowed from current state",
      },
    };
  }

  const nextState: ConversationState = {
    ...state,
    revision: state.revision + 1,
    active_node: input.target,
  };

  return {
    state: nextState,
    transition: {
      type: "NODE_HOP",
      from: state.active_node,
      to: input.target,
      reason: "Explicit transition",
    },
  };
}
