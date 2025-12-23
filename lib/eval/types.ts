import type { ReplayResult } from "../playback/replay-types";

/* ----------------------------------
   GRUNDLÆGGENDE TYPES
---------------------------------- */

export type EvalIssueLevel = "info" | "warning" | "error";

export type EvalIssue = {
  code: string;
  level: EvalIssueLevel;
  message: string;
  turnIndex?: number;
};

/* ----------------------------------
   SINGLE SESSION EVAL
---------------------------------- */

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

/* ----------------------------------
   BATCH EVAL TYPES
---------------------------------- */

export type SessionEval = {
  replay: ReplayResult;
  eval: EvalResult;
};

export type BatchEvalResult = {
  totalSessions: number;

  sessions: SessionEval[];

  aggregates: {
    withClosing: number;
    repeatedClosing: number;
    askedQuestions: number;
    excessiveLength: number;
  };
};

/* ----------------------------------
   INTERNAL CONTEXT
---------------------------------- */

export type EvalContext = {
  replay: ReplayResult;
};
