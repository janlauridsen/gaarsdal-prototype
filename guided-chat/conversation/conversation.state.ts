// guided-chat/conversation/conversation.state.ts

export type ConversationStatus =
  | "active"
  | "paused"
  | "completed"
  | "rejected";

export type ConversationState = {
  /** Uforanderlig identitet */
  conversation_id: string;

  /** Monoton stigende revision */
  revision: number;

  /** Præcis én aktiv node */
  active_node: string;

  /** Lukket sæt transitions der aktuelt er tilladt */
  allowed_transitions: string[];

  /** Akkumuleret og accepteret metadata */
  meta: Record<string, unknown>;

  /** Deklarativ status */
  status: ConversationStatus;
};
