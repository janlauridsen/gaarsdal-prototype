import type { ConversationState, Transition, Node } from "../kernel/types"
import { homeRouterV1 } from "./policies/homeRouterV1"

export type RouterRunResult = {
  transition: Transition
  meta_delta: Record<string, unknown>
}

function nowIso(): string {
  return new Date().toISOString()
}

function safeSnippet(text: string, maxLen: number): string {
  const t = text.trim().replace(/\s+/g, " ")
  if (t.length <= maxLen) return t
  return t.slice(0, maxLen) + "…"
}

function chooseAllowed(next: string, allowed: string[]): string {
  if (allowed.includes(next)) return next
  return allowed[0] ?? "HOME"
}

function resolveRouterId(node: Readonly<Node>): string {
  if (node.id === "HOME") return "home-router-v1"
  return "unknown-router"
}

/**
 * Runs a ROUTER node deterministically.
 * Rule-based only.
 */
export function runRouter(params: {
  node: Readonly<Node>
  state: ConversationState
  userText: string
}): RouterRunResult {
  const node = params.node
  const routerId = resolveRouterId(node)
  const candidates =
    (node.router?.candidates?.length
      ? node.router.candidates
      : node.allowed_exits) ?? []
  const allowed = node.allowed_exits ?? []

  let nextNodeId = candidates[0] ?? allowed[0] ?? node.id
  let confidence = 0
  let reason = "no policy"

  if (routerId === "home-router-v1") {
    const decision = homeRouterV1({
      userText: params.userText,
      candidates,
    })
    nextNodeId = decision.nextNodeId
    confidence = decision.confidence
    reason = decision.reason
  }

  const chosen = chooseAllowed(nextNodeId, allowed)

  const meta_delta = {
    "router.decision": {
      at: nowIso(),
      router_id: routerId,
      from_node: node.id,
      candidates,
      chosen,
      confidence,
      reason,
      user_text_snippet: safeSnippet(params.userText, 180),
    },
  }

  const transition: Transition = {
    type: "NODE_HOP",
    from: params.state.active_node,
    to: chosen,
    reason: `router:${routerId} -> ${chosen}`,
    meta_delta,
  }

  return { transition, meta_delta }
}
