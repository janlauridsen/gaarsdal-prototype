import {
  ConversationState,
  InputSignal,
  Transition,
  KernelResult,
  LogEvent,
} from "./types"
import { getNode } from "../nodes/registry"

/* internal guard */
function assertState(state: ConversationState): void {
  if (!state.conversation_id) throw new Error("missing conversation_id")
  if (state.revision < 0) throw new Error("invalid revision")
  if (!state.active_node) throw new Error("missing active_node")
}

function buildTransition(
  state: ConversationState,
  input: InputSignal
): Transition {
  switch (input.type) {
    case "EXPLICIT_TRANSITION":
      return {
        type: "NODE_HOP",
        from: state.active_node,
        to: input.target,
        reason: "explicit transition",
      }

    case "SYSTEM":
      if (input.intent === "TERMINATE") {
        return {
          type: "TERMINAL",
          from: state.active_node,
          reason: "system terminate",
        }
      }
      return {
        type: "REJECT",
        from: state.active_node,
        reason: "unknown system intent",
      }

    case "FREE_TEXT":
      return {
        type: "REJECT",
        from: state.active_node,
        reason: "free text not actionable in kernel",
      }

    default:
      throw new Error("unknown input")
  }
}

function applyTransition(
  state: ConversationState,
  transition: Transition
): ConversationState {
  if (transition.type === "REJECT") return state

  if (transition.from !== state.active_node) {
    throw new Error("transition.from mismatch")
  }

  const node = getNode(state.active_node)

  if (transition.to && !node.allowed_exits.includes(transition.to)) {
    throw new Error("transition.to not allowed")
  }

  return {
    ...state,
    revision: state.revision + 1,
    active_node: transition.to ?? state.active_node,
    allowed_transitions: transition.to
      ? getNode(transition.to).allowed_exits
      : state.allowed_transitions,
    status:
      transition.type === "TERMINAL"
        ? "completed"
        : state.status,
  }
}

export function runKernel(
  state: ConversationState,
  input: InputSignal
): KernelResult {
  assertState(state)

  const transition = buildTransition(state, input)
  const nextState = applyTransition(state, transition)

  const log: LogEvent = {
    conversation_id: state.conversation_id,
    revision_before: state.revision,
    revision_after: nextState.revision,
    active_node_before: state.active_node,
    active_node_after: nextState.active_node,
    input_type: input.type,
    transition_type: transition.type,
    timestamp: new Date().toISOString(),
  }

  return {
    state: nextState,
    transition,
    log,
  }
}
