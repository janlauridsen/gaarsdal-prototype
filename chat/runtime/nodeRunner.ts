import type {
  ConversationState,
  InputSignal,
  KernelResult,
  Transition,
  Node,
} from "../kernel/types"
import { runKernel } from "../kernel/engine"
import { getNode } from "../nodes/registry"
import { runCapability } from "../ai/runtime"
import { parseFormText } from "../tools/formParsing"
import { runTool } from "../tools/tools"
import { runRouter } from "../router/runRouter"
import { buildContextPackV23 } from "../ai/contextPack"
import { buildUserProfilePromptContext, readUserProfile } from "../memory/store"

export type NodeRunParams = {
  state: ConversationState
  input: InputSignal
  userKey: string
}

const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // keep aligned with other TTLs for now

function norm(s: string): string {
  return s.toLowerCase().trim()
}

/**
 * Runs a node according to its kind.
 *
 * - MENU: allow FREE_TEXT and hop to first exit (or HOME) to avoid REJECT loops from UI
 * - TERMINAL: kernel-only
 * - DIALOG: optional AI capability resolution for FREE_TEXT
 * - FORM: parses and validates FREE_TEXT and writes meta_delta
 * - TOOL/CHECKPOINT: deterministic tool execution (supports SYSTEM ticks for auto-advance)
 * - ROUTER: deterministic routing (supports SYSTEM ticks for auto-advance)
 */
export async function runNode(params: NodeRunParams): Promise<KernelResult> {
  const { state, input } = params
  const node = getNode(state.active_node) as Readonly<Node>

  // ROUTER can run on SYSTEM ticks (auto-advance)
  if (node.kind === "ROUTER" && input.type === "SYSTEM") {
    const { transition } = runRouter({ node, state, userText: "" })
    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // TOOL / CHECKPOINT can run on SYSTEM ticks (auto-advance)
  if ((node.kind === "TOOL" || node.kind === "CHECKPOINT") && input.type === "SYSTEM") {
    const spec = node.kind === "TOOL" ? node.tool : node.checkpoint
    if (!spec) return runKernel(state, input)

    const toolResult = await runTool({
      kind: node.kind,
      spec,
      userKey: params.userKey,
      state,
      userText: "",
    })

    if (toolResult.state_override) {
      const now = new Date().toISOString()
      const result: KernelResult = {
        state: toolResult.state_override,
        transition: {
          type: "INIT",
          from: "SYSTEM",
          to: toolResult.state_override.active_node,
          reason: toolResult.reason,
          response_message: toolResult.response_message,
          meta_delta: toolResult.meta_delta,
        },
        log: {
          conversation_id: toolResult.state_override.conversation_id,
          revision_before: -1,
          revision_after: toolResult.state_override.revision,
          active_node_before: null,
          active_node_after: toolResult.state_override.active_node,
          input_type: "SYSTEM",
          transition_type: "INIT",
          timestamp: now,
        },
      }
      return result
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: toolResult.nextNode,
      reason: toolResult.reason,
      response_message: toolResult.response_message,
      meta_delta: toolResult.meta_delta,
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // Default: let kernel handle it for non FREE_TEXT
  if (input.type !== "FREE_TEXT") {
    return runKernel(state, input)
  }

  // If node does not allow free text, kernel will REJECT.
  if (!node.allow_free_text) {
    return runKernel(state, input)
  }

  // MENU: hop forward to avoid UI free-text causing REJECT
  if (node.kind === "MENU") {
    const text = norm(input.text)
    const toHome = text === "home" || text === "hjem" || text === "tilbage"
    const next = toHome ? "HOME" : (node.allowed_exits?.[0] ?? state.active_node)

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: next,
      reason: "menu free_text -> next",
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  if (node.kind === "ROUTER") {
    const { transition } = runRouter({ node, state, userText: input.text })
    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  if (node.kind === "DIALOG") {
    const capabilityId = node.capability_id ?? null
    if (!capabilityId) {
      // No capability: treat as simple free-text node, and rely on explicit transitions.
      // Default behavior: hop to first exit if user types anything.
      const next = node.allowed_exits?.[0] ?? state.active_node
      const transition: Transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: next,
        reason: "dialog (no capability) -> next",
      }
      return runKernel(state, {
        type: "FREE_TEXT_RESOLVED",
        proposed_transition: transition,
      })
    }

    const contextPack = await buildContextPackV23({
      userKey: params.userKey,
      state,
      ttlSeconds: MEMORY_TTL_SECONDS,
    })
    const profile = await readUserProfile(params.userKey)
    const capabilityResult = await runCapability(capabilityId, {
      state,
      userText: input.text,
      contextPack: {
        system: contextPack.system,
        user_profile: buildUserProfilePromptContext(profile),
      },
    })

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: capabilityResult.transition,
    })
  }

  if (node.kind === "FORM") {
    if (!node.form) {
      return runKernel(state, input)
    }

    const parsed = parseFormText(input.text)
    const missing: string[] = []
    const values: Record<string, unknown> = {}

    for (const field of node.form.fields) {
      const raw = parsed[field.id]
      const value = typeof raw === "string" ? raw.trim() : ""
      if (field.required && !value) {
        missing.push(field.label)
      }
      if (value) values[field.id] = value
    }

    if (missing.length && !node.form.allow_partial) {
      const response =
        `Mangler: ${missing.join(", ")}.\n\n` +
        `Skriv som nøgle:værdi pr linje, fx:\n` +
        node.form.fields
          .map((f) => `- ${f.id}: ${f.placeholder ?? f.label}`)
          .join("\n")

      const stay: Transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: state.active_node,
        reason: "form validation failed",
        response_message: response,
      }
      return runKernel(state, {
        type: "FREE_TEXT_RESOLVED",
        proposed_transition: stay,
      })
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: node.form.on_submit_to,
      reason: "form submitted",
      meta_delta: {
        "form.last": {
          node: state.active_node,
          values,
          submitted_at: new Date().toISOString(),
        },
      },
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  if (node.kind === "TOOL" || node.kind === "CHECKPOINT") {
    const spec = node.kind === "TOOL" ? node.tool : node.checkpoint
    if (!spec) {
      return runKernel(state, input)
    }

    const toolResult = await runTool({
      kind: node.kind,
      spec,
      userKey: params.userKey,
      state,
      userText: input.text,
    })

    if (toolResult.state_override) {
      const now = new Date().toISOString()
      const result: KernelResult = {
        state: toolResult.state_override,
        transition: {
          type: "INIT",
          from: state.active_node,
          to: toolResult.state_override.active_node,
          reason: toolResult.reason,
          response_message: toolResult.response_message,
          meta_delta: toolResult.meta_delta,
        },
        log: {
          conversation_id: toolResult.state_override.conversation_id,
          revision_before: -1,
          revision_after: toolResult.state_override.revision,
          active_node_before: null,
          active_node_after: toolResult.state_override.active_node,
          input_type: "FREE_TEXT",
          transition_type: "INIT",
          timestamp: now,
        },
      }
      return result
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: toolResult.nextNode,
      reason: toolResult.reason,
      response_message: toolResult.response_message,
      meta_delta: toolResult.meta_delta,
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // Default fallback
  return runKernel(state, input)
}
