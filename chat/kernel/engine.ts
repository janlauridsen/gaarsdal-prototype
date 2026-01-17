import {
  ConversationState,
  InputSignal,
  Transition,
} from "./types";

/**
 * KERNE-ENGINE
 * Deterministisk. Ingen sideeffekter.
 */

export function runKernel(
  state: ConversationState,
  signal: InputSignal,
  decide: (
    state: ConversationState,
    signal: InputSignal
  ) => Transition
): { state: ConversationState; transition: Transition } {
  const transition = decide(state, signal);

  if (transition.type === "REJECT") {
    return {
      state: state,
      transition,
    };
  }

  const next: ConversationState = {
    ...state,
    revision: state.revision + 1,
    active_node: transition.to ?? state.active_node,
  };

  return { state: next, transition };
}
