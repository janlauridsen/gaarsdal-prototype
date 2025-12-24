import type { BatchEvalResult } from "../types";
import type { PromptDiffResult } from "./diffTypes";

function cmp(a: boolean, b: boolean) {
  if (a === b) return "same";
  if (!a && b) return "improved";
  return "regressed";
}

export function diffBatchEval(
  base: BatchEvalResult,
  compare: BatchEvalResult
): PromptDiffResult {
  const byId = new Map(
    base.sessions.map((s) => [s.replay.sessionId, s])
  );

  const perSession: PromptDiffResult["perSession"] = [];

  let closingImproved = 0;
  let closingRegressed = 0;
  let questionsImproved = 0;
  let questionsRegressed = 0;
  let lengthImproved = 0;
  let lengthRegressed = 0;

  for (const current of compare.sessions) {
    const baseEval = byId.get(current.replay.sessionId);
    if (!baseEval) continue;

    const closing = cmp(
      baseEval.eval.summary.hasClosing,
      current.eval.summary.hasClosing
    );

    const questions = cmp(
      baseEval.eval.summary.askedQuestions,
      current.eval.summary.askedQuestions
    );

    const length = cmp(
      baseEval.eval.summary.excessiveLength,
      current.eval.summary.excessiveLength
    );

    if (closing === "improved") closingImproved++;
    if (closing === "regressed") closingRegressed++;
    if (questions === "improved") questionsImproved++;
    if (questions === "regressed") questionsRegressed++;
    if (length === "improved") lengthImproved++;
    if (length === "regressed") lengthRegressed++;

    perSession.push({
      sessionId: current.replay.sessionId,
      closing,
      questions,
      length,
    });
  }

  return {
    model: compare.sessions[0]?.replay.model ?? "unknown",
    totals: {
      sessionsCompared: perSession.length,
      closingImproved,
      closingRegressed,
      questionsImproved,
      questionsRegressed,
      lengthImproved,
      lengthRegressed,
    },
    perSession,
  };
}
