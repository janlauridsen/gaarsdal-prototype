/**
 * guided-chat/node-router.ts
 *
 * Rolle:
 * - Eksplicit navigation mellem noder
 * - Ingen logik
 * - Ingen fortolkning
 * - Kun routing
 *
 * Version:
 * - V10.3
 */

/* =====================
   NODE ID
===================== */

export type NodeId =
  | "ROOT"
  | "INFO"
  | "TRIAGE"
  | "CONTACT";

/* =====================
   ROUTES
===================== */

/**
 * ROUTES definerer entydigt:
 * currentNode + chipLabel → nextNode
 *
 * Hvis et opslag mangler:
 * - engine falder tilbage til currentNode
 */
export const ROUTES: Record<
  NodeId,
  Record<string, NodeId>
> = {
  ROOT: {
    "Læs om hypnoterapi": "INFO",
    "Er hypnoterapi relevant for mig?": "TRIAGE",
    "Kontakt": "CONTACT",
  },

  INFO: {
    "Kontakt": "CONTACT",
    "Er hypnoterapi relevant for mig?": "TRIAGE",
  },

  TRIAGE: {
    "Ja": "CONTACT",
    "Nej": "ROOT",
  },

  CONTACT: {
    "Tilbage": "ROOT",
  },
};
