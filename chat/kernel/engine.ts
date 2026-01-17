import {
  ConversationState,
  InputSignal,
  Transition,
  KernelResult,
  LogEvent,
  MetaStore,
} from "./types"
import { getNode } from "../nodes/registry"

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
    }
  }

  if (transition.type === "RESUME") {
    return {
      ...state,
      revision: state.revision + 1,
      status: "active",
      meta: nextMeta,
    }
  }

  if (transition.type === "TERMINAL") {
    return {
      ...state,
      revision: state.revision + 1,
      status: "completed",
      meta: nextMeta,
    }
  }

  if (transition.type === "PARENTESE_OPEN") {
    if (!transition.to) {
      throw new Error("PARENTESE_OPEN requires target")
    }

    const node = getNode(state.active_node)
    if (!node.allowed_exits.includes(transition.to)) {
      throw new Error("parentese open target not allowed")
    }

    return {
      ...state,
      revision: state.revision + 1,
      parentese_stack: [...state.parentese_stack, state.active_node],
      active_node: transition.to,
      allowed_transitions: getNode(transition.to).allowed_exits,
      meta: nextMeta,
    }
  }

  if (transition.type === "PARENTESE_CLOSE") {
    if (state.parentese_stack.length === 0) {
      return state
    }

    const previous = state.parentese_stack[state.parentese_stack.length - 1]

    return {
      ...state,
      revision: state.revision + 1,
      parentese_stack: state.parentese_stack.slice(0, -1),
      active_node: previous,
      allowed_transitions: getNode(previous).allowed_exits,
      meta: nextMeta,
    }
  }

  // NODE_HOP
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
    status: state.status,
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
