/**
 * guided-chat/signals.ts
 *
 * Rolle:
 * - Formelle signaler udledt af brugerinput
 * - Ingen handlinger
 * - Ingen guards
 * - Ingen routing
 *
 * Version:
 * - V10.4
 */

/* =====================
   SIGNAL TYPES
===================== */

/**
 * Signal er et forslag om intention.
 * Det er ikke en handling.
 */
export type Signal =
  | {
      type: "NAVIGATE";
      chip: string;
    }
  | {
      type: "PARENTESE";
      nodeId: string;
    }
  | {
      type: "NEW_SESSION_SIGNAL";
    }
  | {
      type: "NONE";
    };

/* =====================
   RESULT TYPE
===================== */

export type SignalResult = {
  signal: Signal;
  confidence: "high" | "medium" | "low";
};

/* =====================
   HELPERS
===================== */

export function noneSignal(): SignalResult {
  return {
    signal: { type: "NONE" },
    confidence: "low",
  };
}
