/**
 * guided-chat/engine.ts
 *
 * Rolle:
 * - Central beslutningsmotor
 * - Intent → Guards → Action
 * - Ingen UI
 * - Ingen fritekst-parsing
 * - Ingen side effects
 *
 * Version:
 * - V10.3
 * - FASE 4 · STEP 5
 */

import { ResolvedIntent, Action } from "./intents";
import { runGuards } from "./guards";
import { NodeConfig } from "./nodes";
import { ROUTES } from "./node-router";

/* =====================
   PUBLIC API
===================== */

/**
 * decideAction
 *
 * Returnerer præcis én Action for et input.
 * Hvis intent er null eller blokeres → FALLBACK.
 */
export function decideAction(
  intent: ResolvedIntent | null,
  node: NodeConfig
): Action {
  if (!intent) {
    return { type: "FALLBACK" };
  }

  const guardResult = runGuards(intent, node);

  if (guardResult.status !== "ALLOW") {
    return { type: "FALLBACK" };
  }

  switch (intent.kind) {
    case "CHIP": {
      const nextNode =
        ROUTES[node.id]?.[intent.chipId] ?? node.id;

      return {
        type: "NODE_HOP",
        to: nextNode,
      };
    }

    case "PARENTESE": {
      return {
        type: "OPEN_PARENTESE",
        to: intent.nodeId,
      };
    }

    case "NEW_SESSION": {
      return {
        type: "REQUEST_NEW_SESSION_CONFIRMATION",
      };
    }

    default:
      return { type: "FALLBACK" };
  }
}
