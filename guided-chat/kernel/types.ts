// guided-chat/kernel/types.ts

export type ConversationId = string;
export type NodeId = string;
export type MetaDomain = string;

/**
 * INPUT SIGNALS
 */
export type InputSignal =
  | { type: "EXPLICIT_TRANSITION"; target: NodeId }
  | { type: "FREE_TEXT"; text: string }
  | { type: "SYSTEM"; intent: string };

/**
 * TRANSITIONS
 */
export type TransitionType =
  | "NODE_HOP"
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

/**
 * META
 */
export type MetaValue = {
  value: unknown;
  source_node: NodeId;
};

export type MetaStore = Record<MetaDomain, MetaValue>;

/**
 * CONVERSATION STATE
 */
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
