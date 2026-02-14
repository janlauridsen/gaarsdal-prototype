import type { ConversationState, InputSignal, Transition } from "../kernel/types"
import { runKernel } from "../kernel/engine"
import { getNode } from "../nodes/registry"
import { runCapability } from "../ai/runtime"
import type { Node } from "../nodes/registry"
import { parseFormText } from "../tools/formParsing"
import { runTool } from "../tools/tools"

export type NodeRunParams = {
  state: ConversationState
  input: InputSignal
  userKey: string
}

/**
 * Runs a node according to its kind.
 *
 * - MENU/TERMINAL: kernel-only
 * - DIALOG: optional AI capability resolution for FREE_TEXT
 * - FORM: parses and validates FREE_TEXT and writes meta_delta
 * - TOOL/CHECKPOINT: deterministic tool execution
 *
 * NOTE: ROUTER is introduced in PR2.
 */
export async function runNode(params: NodeRunParams) {
  const { state, input } = params
  const node = getNode(state.active_node) as Readonly<Node>

  // Default: let kernel handle it
  if (input.type !== "FREE_TEXT") {
    return runKernel(state, input)
  }

  // If node does not allow free text, kernel will REJECT.
  if (!node.allow_free_text) {
    return runKernel(state, input)
  }

  if (node.kind === "DIALOG") {
    const capabilityId = node.capability_id ?? null
    if (!capabilityId) {
      return runKernel(state, input)
    }

    const capabilityResult = await runCapability(capabilityId, {
      state,
      userText: input.text,
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
      // Keep user in the same node; requires self-transition in allowed_exits.
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

  // MENU/TERMINAL/unknown: let kernel reject unresolved free text
  return runKernel(state, input)
}
