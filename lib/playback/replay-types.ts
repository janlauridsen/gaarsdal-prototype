import type { SessionMeta, SessionTurn } from "../admin-types";

/**
 * Input til replay.
 * Bruges af batch-runner eller single-session replay.
 */
export type ReplayInput = {
  meta: SessionMeta;
  turns: SessionTurn[];
};

/**
 * Ét replay-step (én user → assistant interaktion).
 * Bruges som eval-input.
 */
export type ReplayStep = {
  index: number;

  userText: string;
  assistantText: string;

  chatStateBefore: SessionTurn["chatStateBefore"];
  chatStateAfter: SessionTurn["chatStateAfter"];

  isClosing: boolean;
};

/**
 * Resultat af et fuldt replay af en session.
 * Dette er GRUNDLAGET for evalSession().
 */
export type ReplayResult = {
  sessionId: string;

  promptVersion: string;
  model: string;
  environment: "dev" | "prod";

  startedAt: string;
  endedAt?: string;

  steps: ReplayStep[];
};
