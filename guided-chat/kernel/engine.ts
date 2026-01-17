// guided-chat/kernel/engine.ts

import {
  ConversationState,
  InputSignal,
  Transition,
} from "./types";
import { NODES } from "./nodes";

export function runKernel(
  state: ConversationState,
  input: InputSignal
): { state: ConversationState; transition: Transition } {
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

  const node = NODES[state.active_node];
  if (!node) {
    return {
      state,
      transition: {
        type: "REJECT",
        from: state.active_node,
        reason: "Unknown active node",
      },
    };
  }

  if (!node.allowed_transitions.includes(input.target)) {
    return {
      state,
      transition: {
        type: "REJECT",
        from: state.active_node,
        to: input.target,
        reason: "Target not allowed from current node",
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
