import type { BatchEvalResult } from "../types";

/* ----------------------------------
   PROMPT DIFF RESULT
---------------------------------- */

export type PromptDiffSide = {
  promptVersion: string;
  model: string;
  eval: BatchEvalResult;
};

export type PromptDiffPerSession = {
  sessionId: string;
  base: BatchEvalResult["sessions"][number]["eval"];
  compare: BatchEvalResult["sessions"][number]["eval"];
};

export type PromptDiffResult = {
  base: PromptDiffSide;
  compare: PromptDiffSide;

  diff: {
    totalCompared: number;
    perSession: PromptDiffPerSession[];
  };
};
