// lib/eval/types.ts
import type { ReplayResult } from "../playback/replay-types";

/* ----------------------------------
   ISSUE MODEL
---------------------------------- */

export type EvalIssueLevel = "info" | "warning" | "error";

export type EvalIssue = {
  code: string;
  level: EvalIssueLevel;
  message: string;
  turnIndex?: number;
};

/* ----------------------------------
   SINGLE SESSION EVAL RESULT
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
   SESSION EVAL (REPLAY + EVAL)
---------------------------------- */

export type SessionEval = {
  replay: ReplayResult;
  eval: EvalResult;
};

/* ----------------------------------
   BATCH EVAL RESULT
---------------------------------- */

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
   INTERNAL CONTEXT (READ-ONLY)
---------------------------------- */

export type EvalContext = {
  replay: ReplayResult;
};
