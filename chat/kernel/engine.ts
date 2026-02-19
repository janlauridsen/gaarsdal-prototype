import {
  ConversationState,
  InputSignal,
  Transition,
  KernelResult,
  LogEvent,
  MetaStore,
} from "./types"
import { getNode } from "../nodes/registry"

// Global actions should behave like HOME: they must always be reachable from any state.
// This avoids UX dead-ends when a user triggers a global footer action from inside
// a deep flow where the current node does not list that exit.
const GLOBAL_EXITS: string[] = ["HOME", "MAIL", "TLF", "CONTACT_FORM", "AKUT"]

function assertState(state: ConversationState): void {
  if (!state.conversation_id) throw new Error("missing conversation_id")
  if (state.revision < 0) throw new Error("invalid revision")
  if (!state.active_node) throw new Error("missing active_node")
  if (!Array.isArray(state.parentese_stack))
    throw new Error("missing parentese_stack")
}

function buildTransition(
  state: ConversationState,
  input: InputSignal
): Transition {
  if (state.status === "paused") {
    if (input.type === "SYSTEM" && input.intent === "RESUME") {
      return {
        type: "RESUME",
        from: state.active_node,
        reason: "system resume",
      }
    }
    return {
      type: "REJECT",
      from: state.active_node,
      reason: "only RESUME allowed while paused",
    }
  }

  switch (input.type) {
    case "EXPLICIT_TRANSITION":
      return {
        type: "NODE_HOP",
        from: state.active_node,
        to: input.target,
        reason: "explicit transition",
      }

    case "FREE_TEXT": {
      const node = getNode(state.active_node)
      if (!node.allow_free_text) {
        return {
          type: "REJECT",
          from: state.active_node,
          reason: "free text not allowed in this node",
        }
      }
      return {
        type: "REJECT",
        from: state.active_node,
        reason: "free text requires external resolution",
      }
    }

    case "FREE_TEXT_RESOLVED":
      return {
        ...input.proposed_transition,
        from: state.active_node,
        reason: "free text resolved externally",
      }

    case "SYSTEM":
      switch (input.intent) {
        case "PAUSE":
          return {
            type: "PAUSE",
            from: state.active_node,
            reason: "system pause",
          }
        case "RESUME":
          return {
            type: "REJECT",
            from: state.active_node,
            reason: "resume while not paused",
          }
        case "REJECT":
          return {
            type: "REJECT",
            from: state.active_node,
            reason: "system reject",
          }
        case "TERMINATE":
          return {
            type: "TERMINAL",
            from: state.active_node,
            reason: "system terminate",
          }
      }

    default:
      throw new Error("unknown input")
  }
}

function applyMetaDelta(
  state: ConversationState,
  transition: Transition
): MetaStore {
  if (!transition.meta_delta) return state.meta
  if (transition.type === "REJECT") {
    throw new Error("meta_delta not allowed on REJECT")
  }

  const node = getNode(state.active_node)
  const next: MetaStore = { ...state.meta }

  for (const [domain, value] of Object.entries(transition.meta_delta)) {
    if (!node.meta_domains_written.includes(domain)) {
      throw new Error(`meta domain not writable: ${domain}`)
    }
    next[domain] = {
      value,
      source_node: state.active_node,
    }
  }

  return next
}

function applyTransition(
  state: ConversationState,
  transition: Transition
): ConversationState {
  if (transition.type === "REJECT") return state

  if (transition.from !== state.active_node) {
    throw new Error("transition.from mismatch")
  }

  const nextMeta = applyMetaDelta(state, transition)

  if (transition.type === "PAUSE") {
    return {
      ...state,
      revision: state.revision + 1,
      status: "paused",
      meta: nextMeta,
      active_node_message:
        transition.response_message ?? state.active_node_message,
    }
  }

  if (transition.type === "RESUME") {
    return {
      ...state,
      revision: state.revision + 1,
      status: "active",
      meta: nextMeta,
      active_node_message:
        transition.response_message ?? state.active_node_message,
    }
  }

  if (transition.type === "TERMINAL") {
    return {
      ...state,
      revision: state.revision + 1,
      status: "completed",
      meta: nextMeta,
      active_node_message:
        transition.response_message ?? state.active_node_message,
    }
  }

  if (transition.type === "PARENTESE_OPEN") {
    if (!transition.to) {
      throw new Error("PARENTESE_OPEN requires target")
    }

    const node = getNode(state.active_node)
    if (!node.allowed_exits.includes(transition.to) && !GLOBAL_EXITS.includes(transition.to)) {
      throw new Error("parentese open target not allowed")
    }

    const targetNode = getNode(transition.to)

    return {
      ...state,
      revision: state.revision + 1,
      parentese_stack: [...state.parentese_stack, state.active_node],
      active_node: transition.to,
      active_node_message:
        transition.response_message ?? targetNode.message,
      allowed_transitions: targetNode.allowed_exits,
      meta: nextMeta,
      status: "active",
    }
  }

  if (transition.type === "PARENTESE_CLOSE") {
    if (state.parentese_stack.length === 0) {
      return state
    }

    const previous =
      state.parentese_stack[state.parentese_stack.length - 1]

    const previousNode = getNode(previous)

    return {
      ...state,
      revision: state.revision + 1,
      parentese_stack: state.parentese_stack.slice(0, -1),
      active_node: previous,
      active_node_message:
        transition.response_message ?? previousNode.message,
      allowed_transitions: previousNode.allowed_exits,
      meta: nextMeta,
      status: "active",
    }
  }

  const node = getNode(state.active_node)
  if (transition.to && !node.allowed_exits.includes(transition.to) && !GLOBAL_EXITS.includes(transition.to)) {
    throw new Error("transition.to not allowed")
  }

  const targetNode = transition.to
    ? getNode(transition.to)
    : null

  return {
    ...state,
    revision: state.revision + 1,
    active_node: transition.to ?? state.active_node,
    active_node_message: transition.response_message
      ?? (targetNode
      ? targetNode.message
      : state.active_node_message),
    allowed_transitions: targetNode
      ? targetNode.allowed_exits
      : state.allowed_transitions,
    status:
      targetNode && targetNode.kind === "TERMINAL"
        ? "completed"
        : "active",
    meta: nextMeta,
    parentese_stack: state.parentese_stack,
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
