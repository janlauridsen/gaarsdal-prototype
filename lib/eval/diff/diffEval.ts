// lib/eval/diff/diffEval.ts
import type { BatchEvalResult, SessionEval } from "../types";

/* ----------------------------------
   DIFF RESULT TYPES
---------------------------------- */

export type PromptDiffSession = {
  sessionId: string;

  base: SessionEval["eval"];
  compare: SessionEval["eval"];
};

export type PromptDiffResult = {
  totalCompared: number;

  perSession: PromptDiffSession[];

  aggregates: {
    closingImproved: number;
    repeatedClosingReduced: number;
    excessiveLengthReduced: number;
    askedQuestionsReduced: number;
  };
};

/* ----------------------------------
   DIFF EVALUATION
---------------------------------- */

export function diffEval(
  base: BatchEvalResult,
  compare: BatchEvalResult
): PromptDiffResult {
  const bySessionId = new Map<string, SessionEval>();

  for (const s of base.sessions) {
    bySessionId.set(s.replay.sessionId, s);
  }

  const perSession: PromptDiffSession[] = [];

  let closingImproved = 0;
  let repeatedClosingReduced = 0;
  let excessiveLengthReduced = 0;
  let askedQuestionsReduced = 0;

  for (const s of compare.sessions) {
    const sessionId = s.replay.sessionId;
    const baseSession = bySessionId.get(sessionId);

    if (!baseSession) continue;

    const before = baseSession.eval.summary;
    const after = s.eval.summary;

    if (!before.hasClosing && after.hasClosing) {
      closingImproved++;
    }

    if (before.repeatedClosing && !after.repeatedClosing) {
      repeatedClosingReduced++;
    }

    if (before.excessiveLength && !after.excessiveLength) {
      excessiveLengthReduced++;
    }

    if (before.askedQuestions && !after.askedQuestions) {
      askedQuestionsReduced++;
    }

    perSession.push({
      sessionId,
      base: baseSession.eval,
      compare: s.eval,
    });
  }

  return {
    totalCompared: perSession.length,
    perSession,
    aggregates: {
      closingImproved,
      repeatedClosingReduced,
      excessiveLengthReduced,
      askedQuestionsReduced,
    },
  };
}
