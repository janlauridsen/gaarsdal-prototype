/**
 * guided-chat/free-text-router.ts
 *
 * Rolle:
 * - Adapter fra rå fritekst til ResolvedIntent
 * - Ingen handlinger
 * - Ingen state
 * - Ingen viden om engine, guards, stack eller UI
 *
 * Version:
 * - V10.3
 * - FASE 4 · STEP 3
 */

import { ResolvedIntent } from "./intents";
import { NodeConfig } from "./nodes";

/* =====================
   PUBLIC API
===================== */

export function resolveFreeTextIntent(
  text: string,
  node: NodeConfig
): ResolvedIntent | null {
  const normalized = normalize(text);

  /* =====================
     1. CHIP MATCH (HØJEST PRIORITET)
  ===================== */

  for (const chip of node.navigation.chips) {
    const chipNorm = normalize(chip);
    if (normalized.includes(chipNorm)) {
      return {
        kind: "CHIP",
        chipId: chip,
      };
    }
  }

  /* =====================
     2. PARENTESE MATCH
  ===================== */

  for (const nodeId of node.navigation.freeText.allowParentesTo) {
    const nodeNorm = normalize(nodeId);
    if (normalized.includes(nodeNorm)) {
      return {
        kind: "PARENTESE",
        nodeId,
      };
    }
  }

  /* =====================
     3. NY SAMTALE (SIGNAL)
  ===================== */

  if (node.navigation.freeText.allowNewSession) {
    if (matchesNewSessionSignal(normalized)) {
      return {
        kind: "NEW_SESSION",
      };
    }
  }

  /* =====================
     INGEN FORTOLKNING
  ===================== */

  return null;
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

/**
 * Matcher signal om nyt fokus / ny samtale.
 * Bemærk:
 * - Dette er ikke en handling
 * - Kun et signal der kræver senere validering
 */
function matchesNewSessionSignal(normalized: string): boolean {
  const signals = [
    "ny samtale",
    "nyt fokus",
    "forfra",
    "start forfra",
    "noget andet",
  ];

  return signals.some((s) => normalized.includes(s));
}
