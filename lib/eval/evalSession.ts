import type { ReplayResult } from "../playback/replay-types";
import type {
  EvalResult,
  EvalIssue,
  EvalContext,
} from "./types";

import { evalRedundancy } from "./heuristics/redundancy";
import { evalLength } from "./heuristics/length";
import { evalQuestions } from "./heuristics/questions";
import { evalClinical } from "./heuristics/clinical";
import { evalClosure } from "./heuristics/closure";
import { evalStopRule } from "./heuristics/stopRule";

export function evalSession(replay: ReplayResult): EvalResult {
  const ctx: EvalContext = { replay };

  const issues: EvalIssue[] = [];

  // --- Kør ALLE heuristikker deterministisk ---
  issues.push(...evalRedundancy(ctx));
  issues.push(...evalLength(ctx));
  issues.push(...evalQuestions(ctx));
  issues.push(...evalClinical(ctx));
  issues.push(...evalClosure(ctx));
  issues.push(...evalStopRule(ctx));

  // --- Afled summary FELTER (ingen heuristik sætter dem direkte) ---
  let closingTurnIndex: number | undefined = undefined;
  let closingCount = 0;
  let askedQuestions = false;
  let excessiveLength = false;

  for (let i = 0; i < replay.turns.length; i++) {
    const t = replay.turns[i];
    if (t.isClosing) {
      closingCount++;
      if (closingTurnIndex === undefined) {
        closingTurnIndex = i;
      }
    }
  }

  for (const issue of issues) {
    if (issue.code === "asked_questions") {
      askedQuestions = true;
    }
    if (issue.code === "excessive_length") {
      excessiveLength = true;
    }
  }

  return {
    sessionId: replay.sessionId,
    promptVersion: replay.promptVersion,

    totalTurns: replay.turns.length,
    closingTurnIndex,

    issues,

    summary: {
      hasClosing: closingCount > 0,
      repeatedClosing: closingCount > 1,
      askedQuestions,
      excessiveLength,
    },
  };
}
