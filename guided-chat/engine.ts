/**
 * guided-chat/engine.ts
 *
 * Rolle:
 * - Signal → Guards → Action
 * - Ingen UI
 * - Ingen side effects
 *
 * Version:
 * - V10.4
 */

import { Action } from "./intents";
import { runGuards } from "./guards";
import { NodeConfig } from "./nodes";
import { ROUTES } from "./node-router";
import { SignalResult } from "./signals";

/* =====================
   PUBLIC API
===================== */

export function decideActionFromSignal(
  signalResult: SignalResult,
  node: NodeConfig
): Action {
  const { signal } = signalResult;

  if (signal.type === "NONE") {
    return { type: "FALLBACK" };
  }

  /* =====================
     MAP SIGNAL → INTENT-LIKE SHAPE
  ===================== */

  let intent: any = null;

  switch (signal.type) {
    case "NAVIGATE":
      intent = { kind: "CHIP", chipId: signal.chip };
      break;

    case "PARENTESE":
      intent = { kind: "PARENTESE", nodeId: signal.nodeId };
      break;

    case "NEW_SESSION_SIGNAL":
      intent = { kind: "NEW_SESSION" };
      break;
  }

  /* =====================
     GUARDS
  ===================== */

  const guardResult = runGuards(intent, node);
  if (guardResult.status !== "ALLOW") {
    return { type: "FALLBACK" };
  }

  /* =====================
     ACTION
  ===================== */

  switch (signal.type) {
    case "NAVIGATE": {
      const next =
        ROUTES[node.id]?.[signal.chip] ?? node.id;

      return { type: "NODE_HOP", to: next };
    }

    case "PARENTESE":
      return { type: "OPEN_PARENTESE", to: signal.nodeId };

    case "NEW_SESSION_SIGNAL":
      return { type: "REQUEST_NEW_SESSION_CONFIRMATION" };

    default:
      return { type: "FALLBACK" };
  }
}
