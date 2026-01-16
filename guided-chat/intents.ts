/**
 * guided-chat/intents.ts
 *
 * Rolle:
 * - Fælles kontrakter for afledt intent og systemhandling
 * - Ingen logik
 * - Ingen routing
 * - Ingen state
 *
 * Version:
 * - V10.3
 * - FASE 4 · STEP 2
 */

/* =====================
   BASISTYPER
===================== */

export type NodeId = string;
export type ChipId = string;

/* =====================
   RESOLVED INTENT
===================== */

/**
 * ResolvedIntent repræsenterer systemets fortolkning
 * af et brugerinput (chip eller fritekst).
 *
 * Intent er ikke en handling.
 */
export type ResolvedIntent =
  | {
      kind: "CHIP";
      chipId: ChipId;
    }
  | {
      kind: "PARENTESE";
      nodeId: NodeId;
    }
  | {
      kind: "NEW_SESSION";
    };

/* =====================
   SYSTEM ACTION
===================== */

/**
 * Action er den konkrete handling, systemet udfører
 * efter guards er passeret.
 *
 * Præcis én action per turn.
 */
export type Action =
  | {
      type: "NODE_HOP";
      to: NodeId;
    }
  | {
      type: "OPEN_PARENTESE";
      to: NodeId;
    }
  | {
      type: "REQUEST_NEW_SESSION_CONFIRMATION";
    }
  | {
      type: "START_NEW_SESSION";
    }
  | {
      type: "FALLBACK";
    };
