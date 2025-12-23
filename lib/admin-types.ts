// lib/admin-types.ts

export type ChatState =
  | "welcome"
  | "orienting"
  | "screening"
  | "closed";

export type SessionMeta = {
  sessionId: string;
  startedAt: string;
  endedAt?: string;

  model: string;
  promptVersion: string;
  environment: "dev" | "prod";

  closedReason?: "concluded" | "aborted" | "error";
};

export type SessionTurn = {
  sessionId: string;
  turnIndex: number;

  userText: string;
  assistantText: string;

  chatStateBefore: ChatState;
  chatStateAfter: ChatState;

  isClosing: boolean;
  timestamp: string;
};
