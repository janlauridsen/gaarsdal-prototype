import type { ReplayResult } from "../playback/replay-types";
import type { EvalResult, EvalContext } from "./types";

import { checkClosure } from "./heuristics/closure";
import { checkLength } from "./heuristics/length";
import { checkQuestions } from "./heuristics/questions";
import { checkRedundancy } from "./heuristics/redundancy";
import { checkStopRule } from "./heuristics/stopRule";

export function evalSession(replay: ReplayResult): EvalResult {
  const ctx: EvalContext = { replay };

  const issues = [
    ...checkClosure(ctx),
    ...checkStopRule(ctx),
    ...checkRedundancy(ctx),
    ...checkLength(ctx),
    ...checkQuestions(ctx),
  ];

  const closingStep = replay.steps.find((s) => s.isClosing);

  return {
    sessionId: replay.sessionId,
    promptVersion: replay.promptVersion,

    totalTurns: replay.steps.length,
    closingTurnIndex: closingStep?.index,

    issues,

    summary: {
      hasClosing: Boolean(closingStep),
      repeatedClosing:
        issues.some((i) => i.code === "REPEATED_CLOSING"),
      excessiveLength:
        issues.some((i) => i.code === "LONG_RESPONSE"),
      askedQuestions:
        issues.some((i) => i.code === "QUESTION_USED"),
    },
  };
}
