import type { ChatState } from "../admin-types";

/* ======================================================
   INPUT (fra logging – stabil, historisk sandhed)
====================================================== */

export type LoggedTurn = {
  sessionId: string;
  turnIndex: number;

  userText: string;
  assistantText: string;

  chatStateBefore: ChatState;
  chatStateAfter: ChatState;

  isClosing: boolean;
  timestamp: string;
};

export type LoggedSession = {
  sessionId: string;
  startedAt: string;
  endedAt?: string;

  model: string;
  promptVersion: string;
  environment: "dev" | "prod";

  closedReason?: "concluded" | "aborted" | "error";

  turns: LoggedTurn[];
};

/* ======================================================
   REPLAY MESSAGE (deterministisk input)
====================================================== */

export type ReplayMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/* ======================================================
   REPLAY TURN (én deterministisk step)
====================================================== */

export type ReplayTurn = {
  turnIndex: number;

  /**
   * Fuldt message-stack frem til
   * og med bruger-input for dette turn.
   */
  inputMessages: ReplayMessage[];

  /**
   * Output som MODELLEN gav dengang
   * (eller giver ved replay/compare).
   */
  outputText: string;

  chatStateBefore: ChatState;
  chatStateAfter: ChatState;

  isClosing: boolean;
};

/* ======================================================
   REPLAY RESULT (DEN ENESTE SANDE PLAYBACK-OUTPUT)
====================================================== */

export type ReplayResult = {
  sessionId: string;
  promptVersion: string;
  model: string;

  totalTurns: number;
  turns: ReplayTurn[];

  summary: {
    hasClosing: boolean;
    closingTurnIndex?: number;
    repeatedClosing: boolean;
  };
};

/* ======================================================
   INTERN CONTEXT (IKKE PERSISTENT)
====================================================== */

export type ReplayContext = {
  systemPrompt: string;
};
