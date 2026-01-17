/**
 * LOGGING CONTRACT
 * Append-only. Replay-bar. Ingen afledt logik.
 * Afledt af Artefakt 4 og 8.
 */

import {
  ConversationId,
  NodeId,
  InputSignal,
  Transition,
  ConversationState,
} from "../kernel";

/* =========================
   LOG ENTRY
========================= */

export type LogEntry = {
  /**
   * Monoton stigende per conversation.
   * Skal matche state.revision efter transition.
   */
  revision: number;

  conversation_id: ConversationId;

  timestamp: string;

  /**
   * Hvad brugeren/systemet gjorde.
   */
  input: InputSignal;

  /**
   * Hvilken transition der blev anvendt.
   * Undefined hvis input blev afvist.
   */
  transition?: Transition;

  /**
   * State før og efter.
   * Muliggør fuld replay og audit.
   */
  prev_state: ConversationState;
  next_state: ConversationState;
};

/* =========================
   LOG STREAM
========================= */

export type ConversationLog = {
  conversation_id: ConversationId;
  entries: LogEntry[];
};
