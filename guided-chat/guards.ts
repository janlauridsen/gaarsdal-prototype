import { Action, ResolvedIntent } from "./intents";
import { NodeConfig } from "./nodes";

export type GuardResult =
  | { status: "ALLOW" }
  | { status: "BLOCK"; reason: string }
  | { status: "ESCALATE"; to: string };

export function runGuards(
  intent: ResolvedIntent,
  node: NodeConfig
): GuardResult {
  /* TERMINAL GUARD */
  if (node.terminal) {
    return { status: "BLOCK", reason: "terminal-node" };
  }

  /* SCOPE GUARD */
  if (intent.kind === "CHIP") {
    if (!node.navigation.chips.includes(intent.chipId)) {
      return { status: "BLOCK", reason: "chip-not-allowed" };
    }
  }

  if (intent.kind === "PARENTESE") {
    if (
      !node.navigation.freeText.allowParentesTo?.includes(intent.nodeId)
    ) {
      return { status: "BLOCK", reason: "parentese-not-allowed" };
    }
  }

  if (intent.kind === "NEW_SESSION") {
    if (!node.navigation.freeText.allowNewSession) {
      return { status: "BLOCK", reason: "new-session-not-allowed" };
    }
  }

  return { status: "ALLOW" };
}
