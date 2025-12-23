import type { ChatState } from "../admin-types";

/* ----------------------------------
   INPUT (fra logging)
---------------------------------- */

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

/* ----------------------------------
   REPLAY OUTPUT
---------------------------------- */

export type ReplayMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ReplayTurn = {
  turnIndex: number;

  inputMessages: ReplayMessage[];
  outputText: string;

  chatStateBefore: ChatState;
  chatStateAfter: ChatState;

  isClosing: boolean;
};

/* ----------------------------------
   REPLAY RESULT
---------------------------------- */

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

/* ----------------------------------
   INTERNAL CONTEXT (IKKE PERSISTENT)
---------------------------------- */

export type ReplayContext = {
  systemPrompt: string;
};
