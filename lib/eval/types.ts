import type { ReplayResult } from "../playback/replay-types";

export type EvalIssueLevel = "info" | "warning" | "error";

export type EvalIssue = {
  code: string;
  level: EvalIssueLevel;
  message: string;
  turnIndex?: number;
};

export type EvalResult = {
  sessionId: string;
  promptVersion: string;

  totalTurns: number;
  closingTurnIndex?: number;

  issues: EvalIssue[];

  summary: {
    hasClosing: boolean;
    repeatedClosing: boolean;
    excessiveLength: boolean;
    askedQuestions: boolean;
  };
};

export type EvalContext = {
  replay: ReplayResult;
};

