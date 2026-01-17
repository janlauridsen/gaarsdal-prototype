import {
  ConversationState,
  InputSignal,
  Transition,
} from "./types"
import { getNode } from "../nodes/registry"
import { buildLogEvent } from "../logging/buildLog"

export function runKernel(
  state: ConversationState,
  input: InputSignal
): {
  state: ConversationState
  transition: Transition
  log: any
} {
  const currentNode = getNode(state.active_node)

  let transition: Transition

  // -----------------------------
  // INPUT REDUCTION
  // -----------------------------

  if (input.type === "FREE_TEXT") {
    transition = {
      type: "REJECT",
      from: state.active_node,
      reason: "FREE_TEXT_NOT_ALLOWED",
    }
  } else if (input.type === "EXPLICIT_TRANSITION") {
    if (!state.allowed_transitions.includes(input.target)) {
      transition = {
        type: "REJECT",
        from: state.active_node,
        reason: "TARGET_NOT_ALLOWED",
      }
    } else {
      transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: input.target,
        reason: "EXPLICIT",
      }
    }
  } else {
    transition = {
      type: "REJECT",
      from: state.active_node,
      reason: "UNKNOWN_INPUT",
    }
  }

  // -----------------------------
  // APPLY TRANSITION
  // -----------------------------

  let nextState: ConversationState = {
    ...state,
    revision: state.revision + 1,
  }

  if (transition.type === "NODE_HOP" && transition.to) {
    const targetNode = getNode(transition.to)

    nextState = {
      ...nextState,
      active_node: targetNode.id,
      allowed_transitions: targetNode.allowed_exits,
      status:
        targetNode.kind === "TERMINAL"
          ? "completed"
          : state.status,
    }
  }

  // REJECT og andre typer ændrer ikke state udover revision

  // -----------------------------
  // LOGGING
  // -----------------------------

  const log = buildLogEvent({
    stateBefore: state,
    stateAfter: nextState,
    input,
    transition,
  })

  return {
    state: nextState,
    transition,
    log,
  }
}
