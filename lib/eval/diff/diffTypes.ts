import type { BatchEvalResult } from "../types";

export type PromptDiffResult = {
  base: {
    promptVersion: string;
    model: string;
  };
  compare: {
    promptVersion: string;
    model: string;
  };

  totals: {
    sessionsCompared: number;

    closingImproved: number;
    closingRegressed: number;

    questionsImproved: number;
    questionsRegressed: number;

    lengthImproved: number;
    lengthRegressed: number;
  };

  perSession: {
    sessionId: string;

    closing: "improved" | "regressed" | "same";
    questions: "improved" | "regressed" | "same";
    length: "improved" | "regressed" | "same";
  }[];
};
