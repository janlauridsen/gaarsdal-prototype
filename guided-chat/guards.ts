/**
 * guided-chat/guards.ts
 *
 * Rolle:
 * - Beskytte systemet mod ugyldige handlinger
 * - Ingen routing
 * - Ingen state
 * - Ingen side effects
 *
 * Version:
 * - V10.3
 * - FASE 4 · STEP 4
 */

import { ResolvedIntent } from "./intents";
import { NodeConfig } from "./nodes";

/* =====================
   GUARD RESULT
===================== */

export type GuardResult =
  | {
      status: "ALLOW";
    }
  | {
      status: "BLOCK";
      reason: GuardReason;
    }
  | {
      status: "ESCALATE";
      to: string;
      reason: GuardReason;
    };

export type GuardReason =
  | "scope-not-allowed"
  | "terminal-node"
  | "structure-violation"
  | "risk-detected";

/* =====================
   PUBLIC API
===================== */

export function runGuards(
  intent: ResolvedIntent,
  node: NodeConfig
): GuardResult {
  /* =====================
     TERMINAL GUARD
  ===================== */

  if (node.terminal === true) {
    return {
      status: "BLOCK",
      reason: "terminal-node",
    };
  }

  /* =====================
     SCOPE GUARD
  ===================== */

  if (intent.kind === "CHIP") {
    if (!node.navigation.chips.includes(intent.chipId)) {
      return {
        status: "BLOCK",
        reason: "scope-not-allowed",
      };
    }
  }

  if (intent.kind === "PARENTESE") {
    if (
      !node.navigation.freeText.allowParentesTo.includes(intent.nodeId)
    ) {
      return {
        status: "BLOCK",
        reason: "scope-not-allowed",
      };
    }
  }

  if (intent.kind === "NEW_SESSION") {
    if (!node.navigation.freeText.allowNewSession) {
      return {
        status: "BLOCK",
        reason: "scope-not-allowed",
      };
    }
  }

  /* =====================
     STRUKTUR GUARD
  ===================== */

  // Struktur (stack / parentes) håndteres i engine.
  // Guarden sikrer kun, at intent ikke bryder kontrakten.
  // Yderligere strukturregler kan indsættes her senere.

  /* =====================
     RISIKO GUARD (ETIK)
  ===================== */

  // Denne guard er bevidst simpel i V10.
  // Al egentlig risikovurdering ligger i post-analysis.
  // Hvis der senere ønskes real-time eskalation,
  // returneres ESCALATE her.

  return {
    status: "ALLOW",
  };
}
