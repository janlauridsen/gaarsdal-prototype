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

import { NodeId, ROUTES } from "./node-router";
import { NodeConfig } from "./nodes";
import { SignalResult } from "./signals";
import { runGuards } from "./guards";

/* =====================
   ACTION TYPES
===================== */

export type Action =
  | { type: "NODE_HOP"; to: NodeId }
  | { type: "OPEN_PARENTESE"; to: NodeId }
  | { type: "REQUEST_NEW_SESSION_CONFIRMATION" }
  | { type: "FALLBACK" };

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
     INTENT SHAPE
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

  const guard = runGuards(intent, node);
  if (guard.status !== "ALLOW") {
    return { type: "FALLBACK" };
  }

  /* =====================
     ACTION
  ===================== */

  switch (signal.type) {
    case "NAVIGATE": {
      const next: NodeId =
        ROUTES[node.id]?.[signal.chip] ?? node.id;
      return { type: "NODE_HOP", to: next };
    }

    case "PARENTESE":
      return { type: "OPEN_PARENTESE", to: signal.nodeId as NodeId };

    case "NEW_SESSION_SIGNAL":
      return { type: "REQUEST_NEW_SESSION_CONFIRMATION" };

    default:
      return { type: "FALLBACK" };
  }
}
