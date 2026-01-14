/**
 * guided-chat/free-text-router.ts
 *
 * Rolle:
 * - Fri tekst → SignalResult
 * - Ingen handlinger
 * - Ingen guards
 *
 * Version:
 * - V10.4
 */

import { NodeConfig } from "./nodes";
import { SignalResult, noneSignal } from "./signals";

/* =====================
   PUBLIC API
===================== */

export function resolveFreeTextSignal(
  text: string,
  node: NodeConfig
): SignalResult {
  const normalized = normalize(text);

  /* =====================
     1. NAVIGATION (chip match)
  ===================== */

  for (const chip of node.chips ?? []) {
    if (normalized.includes(normalize(chip))) {
      return {
        signal: { type: "NAVIGATE", chip },
        confidence: "high",
      };
    }
  }

  /* =====================
     2. PARENTESE
  ===================== */

  const parentesTargets = node.navigation?.freeText?.allowParentesTo ?? [];

  for (const nodeId of parentesTargets) {
    if (normalized.includes(normalize(nodeId))) {
      return {
        signal: { type: "PARENTESE", nodeId },
        confidence: "medium",
      };
    }
  }

  /* =====================
     3. NEW SESSION SIGNAL
  ===================== */

  if (
    node.navigation?.freeText?.allowNewSession &&
    matchesNewSessionSignal(normalized)
  ) {
    return {
      signal: { type: "NEW_SESSION_SIGNAL" },
      confidence: "medium",
    };
  }

  /* =====================
     NONE
  ===================== */

  return noneSignal();
}

/* =====================
   HELPERS
===================== */

function normalize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function matchesNewSessionSignal(normalized: string): boolean {
  const signals = [
    "ny samtale",
    "nyt emne",
    "noget andet",
    "start forfra",
    "skift fokus",
  ];

  return signals.some((s) => normalized.includes(s));
}
