/**
 * KERNE-TYPER
 * Normativ baseline.
 * Ingen UI, ingen runtime-detaljer.
 */

export type ConversationId = string;
export type NodeId = string;
export type MetaDomain = string;

/* =========================
   INPUT
========================= */

export type InputSignal =
  | { type: "EXPLICIT_TRANSITION"; target: NodeId }
  | { type: "FREE_TEXT"; text: string }
  | { type: "SYSTEM"; intent: string };

/* =========================
   TRANSITION
========================= */

export type TransitionType =
  | "NODE"
  | "PARENTESE_OPEN"
  | "PARENTESE_CLOSE"
  | "TERMINAL"
  | "REJECT";

export type Transition = {
  type: TransitionType;
  from: NodeId;
  to?: NodeId;
  reason: string;
};

/* =========================
   META
========================= */

export type MetaValue = {
  value: unknown;
  source: NodeId;
};

export type MetaStore = Record<MetaDomain, MetaValue>;

/* =========================
   STATE
========================= */

export type ConversationStatus =
  | "active"
  | "paused"
  | "completed"
  | "rejected";

export type ConversationState = {
  conversation_id: ConversationId;
  revision: number;
  active_node: NodeId;
  allowed_transitions: NodeId[];
  meta: MetaStore;
  status: ConversationStatus;
};
