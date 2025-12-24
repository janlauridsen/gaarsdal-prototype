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

  for (const c of compare.sessions) {
    const b = byId.get(c.replay.sessionId);
    if (!b) continue;

    const closing = cmp(
      b.eval.summary.hasClosing,
      c.eval.summary.hasClosing
    );

    const questions = cmp(
      !b.eval.summary.askedQuestions,
      !c.eval.summary.askedQuestions
    );

    const length = cmp(
      !b.eval.summary.excessiveLength,
      !c.eval.summary.excessiveLength
    );

    if (closing === "improved") closingImproved++;
    if (closing === "regressed") closingRegressed++;

    if (questions === "improved") questionsImproved++;
    if (questions === "regressed") questionsRegressed++;

    if (length === "improved") lengthImproved++;
    if (length === "regressed") lengthRegressed++;

    perSession.push({
      sessionId: c.replay.sessionId,
      closing,
      questions,
      length,
    });
  }

  return {
    base: {
  promptVersion: base.sessions[0]?.replay.promptVersion ?? "unknown",
  model: base.sessions[0]?.replay.model ?? "unknown",
},
compare: {
  promptVersion: compare.sessions[0]?.replay.promptVersion ?? "unknown",
  model: compare.sessions[0]?.replay.model ?? "unknown",
},
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
