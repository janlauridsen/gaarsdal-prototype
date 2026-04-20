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
// NOTE: These are allowed regardless of the active node's declared exits.
// MAIL/TLF/CONTACT_FORM/AKUT are handled as "parentese" overlays so the user can resume.
// HOME remains a hard break back to the menu.
const GLOBAL_EXITS: string[] = ["HOME", "MAIL", "TLF", "CONTACT_FORM", "AKUT", "RESUME"]

type UxEvent = { type: "popup_opened" | "navigate"; id: string; ts: string }

function uiActionBody(action: "TLF" | "MAIL" | "AKUT" | "CONTACT_FORM"): string {
  switch (action) {
    case "TLF":
      return "Du kan ringe eller sende sms til 42 80 74 74. Jeg svarer, så snart jeg kan."
    case "MAIL":
      return "Du kan kontakte mig via e-mail på jan@gaarsdal.net."
    case "AKUT":
      return (
        "Akut hjælp i Danmark: Ring 112 ved livstruende situationer. " +
        "Voksne: Livslinien 70 201 201 (døgnåben). " +
        "Børn og unge: BørneTelefonen 116 111. " +
        "Psykiatrisk akutmodtagelse kan kontaktes via 1813 (Region Hovedstaden) eller din region."
      )
    case "CONTACT_FORM":
      // Navigation happens in the frontend. Keep the response empty to avoid duplicating
      // the current node message.
      return ""
  }
}

function nextUxMetaValue(state: ConversationState, event: UxEvent): unknown {
  const current = (state.meta as any)?.ux?.value
  const counters = { ...(current?.counters ?? {}) } as Record<string, number>
  const events = Array.isArray(current?.events) ? [...current.events] : []

  // Counters (deterministic)
  switch (event.id) {
    case "TLF":
      counters.phone_clicks = (counters.phone_clicks ?? 0) + 1
      break
    case "MAIL":
      counters.mail_clicks = (counters.mail_clicks ?? 0) + 1
      break
    case "AKUT":
      counters.akut_clicks = (counters.akut_clicks ?? 0) + 1
      break
    case "CONTACT_FORM":
      counters.contact_page_visits = (counters.contact_page_visits ?? 0) + 1
      break
  }

  events.push(event)

  // Cap events to avoid unbounded growth
  const MAX_EVENTS = 200
  const capped = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events

  return { counters, events: capped }
}

function uxMetaDeltaForGlobalAction(state: ConversationState, target: string): Record<string, unknown> | null {
  if (target !== "TLF" && target !== "MAIL" && target !== "CONTACT_FORM" && target !== "AKUT") return null
  const ev: UxEvent = {
    type: target === "CONTACT_FORM" ? "navigate" : "popup_opened",
    id: target,
    ts: new Date().toISOString(),
  }
  return { ux: nextUxMetaValue(state, ev) }
}

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
      // RESUME: close the latest parentese (if any)
      if (input.target === "RESUME") {
        return {
          type: "PARENTESE_CLOSE",
          from: state.active_node,
          to:
            state.parentese_stack.length > 0
              ? state.parentese_stack[state.parentese_stack.length - 1]
              : null,
          reason: "resume from parentese",
        }
      }

      const uxMetaDelta = uxMetaDeltaForGlobalAction(state, input.target)

      // Global overlays: open parentese (push current node onto stack).
      // HOME is intentionally *not* a parentese; it's a break back to the menu.
      if (
        input.target !== "HOME" &&
        GLOBAL_EXITS.includes(input.target) &&
        getNode(state.active_node).allow_parentese
      ) {
        return {
          type: "PARENTESE_OPEN",
          from: state.active_node,
          to: input.target,
          reason: "global action (parentese)",
          ...(uxMetaDelta ? { meta_delta: uxMetaDelta } : {}),
        }
      }

      // Reset closing-kontekst når bruger navigerer tilbage til GEN_HYPNO.
      // Forhindrer at dialog.stage="closing" + dialog.relational_state="decision_support"
      // fra et foregående HANDOFF_FORM-besøg dominerer LLM routing i næste turn.
      const isReturnToHypno = input.target === "GEN_HYPNO" &&
        (state.active_node === "HANDOFF_FORM" || state.active_node === "CLIENT_SUPPORT")

      const returnResetDelta = isReturnToHypno ? {
        "dialog.stage": "open",
        "dialog.relational_state": "building_clarity",
        "dialog.mode": "info",
        "dialog.move": "direct_answer",
      } : null

      const combinedDelta = returnResetDelta
        ? { ...(uxMetaDelta ?? {}), ...returnResetDelta }
        : uxMetaDelta

      return {
        type: "NODE_HOP",
        from: state.active_node,
        to: input.target,
        reason: "explicit transition",
        ...(combinedDelta ? { meta_delta: combinedDelta } : {}),
      }

    case "UI_ACTION": {
      // UI actions (footer) must never change nodes. They only emit audit messages and UX meta.
      const uxMetaDelta = uxMetaDeltaForGlobalAction(state, input.action)
      return {
        type: "NODE_HOP",
        from: state.active_node,
        reason: "ui action",
        response_message: uiActionBody(input.action),
        ...(uxMetaDelta ? { meta_delta: uxMetaDelta } : {}),
      }
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

  // Normalize transitions so logs/events never carry an undefined destination.
  // In practice this happens when external routing resolves FREE_TEXT into a
  // logical NODE_HOP but does not provide `to` (meaning the node stays the same).
  // The state already reflects the truth; this just aligns the transition payload.
  const normalizedTransition =
    transition.type === "NODE_HOP" && !transition.to
      ? { ...transition, to: nextState.active_node }
      : transition

  const log: LogEvent = {
    conversation_id: state.conversation_id,
    revision_before: state.revision,
    revision_after: nextState.revision,
    active_node_before: state.active_node,
    active_node_after: nextState.active_node,
    input_type: input.type,
    transition_type: normalizedTransition.type,
    timestamp: new Date().toISOString(),
  }

  return {
    state: nextState,
    transition: normalizedTransition,
    log,
  }
}
