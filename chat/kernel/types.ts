// chat/kernel/types.ts
// KERNEL CONTRACT · NORMATIV
// Afledt direkte af Artefakt 1–8

/* =========================
   PRIMITIVES
========================= */

export type ConversationId = string;
export type NodeId = string;
export type MetaDomain = string;

/* =========================
   INPUT SIGNALS
========================= */

/**
 * InputSignal repræsenterer ALT input til systemet.
 * UI, fritekst og systeminput er ens i kernel.
 */
export type InputSignal =
  | {
      type: "EXPLICIT_TRANSITION";
      target: NodeId;
    }
  | {
      type: "FREE_TEXT";
      text: string;
    }
  | {
      type: "SYSTEM";
      intent: string;
    };

/* =========================
   TRANSITIONS
========================= */

/**
 * TransitionType er det lukkede sæt af tilladte state-ændringer.
 */
export type TransitionType =
  | "NODE_HOP"
  | "PARENTESE_OPEN"
  | "PARENTESE_CLOSE"
  | "TERMINAL"
  | "REJECT";

/**
 * Transition er den ENESTE mekanisme,
 * hvormed ConversationState må ændres.
 */
export type Transition = {
  type: TransitionType;
  from: NodeId;
  to?: NodeId;
  reason: string;
};

/* =========================
   META
========================= */

/**
 * MetaValue er al akkumuleret viden,
 * som overlever node-skift.
 */
export type MetaValue = {
  value: unknown;
  source_node: NodeId;
};

export type MetaStore = Record<MetaDomain, MetaValue>;

/* =========================
   CONVERSATION STATE
========================= */

/**
 * ConversationStatus er deklarativ.
 * Ingen implicit status.
 */
export type ConversationStatus =
  | "active"
  | "paused"
  | "completed"
  | "rejected";

/**
 * ConversationState er den fulde,
 * autoritative og serialiserbare state.
 */
export type ConversationState = {
  conversation_id: ConversationId;
  revision: number;
  active_node: NodeId;
  allowed_transitions: NodeId[];
  meta: MetaStore;
  status: ConversationStatus;
};
