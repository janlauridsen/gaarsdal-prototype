import type { ReplayResult } from "../playback/replay-types";
import type {
  EvalResult,
  EvalIssue,
} from "./types";

import { checkClosure } from "./heuristics/closure";
import { checkStopRule } from "./heuristics/stopRule";
import { checkRedundancy } from "./heuristics/redundancy";
import { checkLength } from "./heuristics/length";
import { checkQuestions } from "./heuristics/questions";

/* ----------------------------------
   EVAL SINGLE SESSION
---------------------------------- */

export function evalSession(
  replay: ReplayResult
): EvalResult {
  const issues: EvalIssue[] = [];

  /* -----------------------------
     HEURISTICS
  ----------------------------- */

  issues.push(...checkClosure(replay));
  issues.push(...checkStopRule(replay));
  issues.push(...checkRedundancy(replay));
  issues.push(...checkLength(replay));
  issues.push(...checkQuestions(replay));

  /* -----------------------------
     SUMMARY FLAGS
  ----------------------------- */

  const hasClosing = replay.summary.hasClosing;

  const repeatedClosing =
    replay.summary.repeatedClosing ||
    issues.some((i) => i.code === "REPEATED_CLOSING");

  const excessiveLength = issues.some(
    (i) => i.code === "EXCESSIVE_LENGTH"
  );

  const askedQuestions = issues.some(
    (i) => i.code === "QUESTION_ASKED"
  );

  /* -----------------------------
     RESULT
  ----------------------------- */

  return {
    sessionId: replay.sessionId,
    promptVersion: replay.promptVersion,

    totalTurns: replay.totalTurns,
    closingTurnIndex: replay.summary.closingTurnIndex,

    issues,

    summary: {
      hasClosing,
      repeatedClosing,
      excessiveLength,
      askedQuestions,
    },
  };
}
