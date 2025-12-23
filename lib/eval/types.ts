// lib/eval/types.ts
export * from "../playback/types";

export type EvalCriterion =
  | "closure_timing"
  | "question_policy"
  | "clinical_boundary"
  | "redundancy"
  | "tone_neutrality"
  | "prompt_compliance";

export type TurnEval = {
  turnIndex: number;

  deltas: {
    closureChanged?: boolean;
    questionsAdded?: number;
    questionsRemoved?: number;
    lengthDelta?: number;
  };

  flags: {
    violatedStopRule?: boolean;
    askedAfterClosure?: boolean;
    advisoryLanguage?: boolean;
  };

  notes?: string;
};

export type SessionEval = {
  sessionId: string;

  summary: {
    regression: boolean;
    improvement: boolean;
    neutral: boolean;
  };

  flags: {
    hardRegression?: boolean;
    needsReview?: boolean;
  };

  turnEvals: TurnEval[];
};

export type BatchEvalResult = {
  batchId: string;
  evalVersion: string;
  evaluatedAt: string;

  totals: {
    sessions: number;
    regressions: number;
    improvements: number;
    neutral: number;
  };

  sessions: SessionEval[];
};
