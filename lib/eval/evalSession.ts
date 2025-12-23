import type { ReplayResult } from "../playback/replay-types";
import type {
  EvalResult,
  EvalIssue,
} from "./types";

import { checkClosure } from "./heuristics/closure";
import { checkLength } from "./heuristics/length";
import { checkQuestions } from "./heuristics/questions";
import { checkRedundancy } from "./heuristics/redundancy";
import { checkStopRule } from "./heuristics/stopRule";

/* ----------------------------------
   EVALUATE SINGLE SESSION
---------------------------------- */

export function evalSession(
  replay: ReplayResult
): EvalResult {
  const issues: EvalIssue[] = [];

  /* ----------------------------------
     RUN HEURISTICS
  ---------------------------------- */

  const closureIssues = checkClosure(replay);
  const lengthIssues = checkLength(replay);
  const questionIssues = checkQuestions(replay);
  const redundancyIssues = checkRedundancy(replay);
  const stopRuleIssues = checkStopRule(replay);

  issues.push(
    ...closureIssues,
    ...lengthIssues,
    ...questionIssues,
    ...redundancyIssues,
    ...stopRuleIssues
  );

  /* ----------------------------------
     DERIVED FLAGS
  ---------------------------------- */

  let hasClosing = false;
  let repeatedClosing = false;
  let excessiveLength = false;
  let askedQuestions = false;

  let closingTurnIndex: number | undefined = undefined;

  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];

    if (issue.code === "CLOSING_DETECTED") {
      hasClosing = true;
      if (closingTurnIndex === undefined && issue.turnIndex !== undefined) {
        closingTurnIndex = issue.turnIndex;
      }
    }

    if (issue.code === "REPEATED_CLOSING") {
      repeatedClosing = true;
    }

    if (issue.code === "EXCESSIVE_RESPONSE_LENGTH") {
      excessiveLength = true;
    }

    if (issue.code === "ASSISTANT_ASKED_QUESTION") {
      askedQuestions = true;
    }
  }

  /* ----------------------------------
     RESULT
  ---------------------------------- */

  return {
    sessionId: replay.sessionId,
    promptVersion: replay.promptVersion,

    totalTurns: replay.turns.length,
    closingTurnIndex,

    issues,

    summary: {
      hasClosing,
      repeatedClosing,
      excessiveLength,
      askedQuestions,
    },
  };
}
