// lib/eval/evalSession.ts
import type { ReplayResult } from "../playback/replay-types";
import type { EvalResult, EvalIssue } from "./types";

/* ----------------------------------
   SINGLE SESSION EVALUATION
---------------------------------- */

export function evalSession(replay: ReplayResult): EvalResult {
  const issues: EvalIssue[] = [];

  const totalTurns = replay.turns.length;

  const { hasClosing, closingTurnIndex, repeatedClosing } =
    replay.summary;

  /* ----------------------------------
     RULE: EXCESSIVE LENGTH
  ---------------------------------- */
  const excessiveLength = totalTurns > 6;

  if (excessiveLength) {
    issues.push({
      code: "excessive_length",
      level: "warning",
      message:
        "Sessionen indeholder mange turns i forhold til screeningsformålet.",
    });
  }

  /* ----------------------------------
     RULE: ASKED QUESTIONS
  ---------------------------------- */
  let askedQuestions = false;

  for (const turn of replay.turns) {
    if (turn.outputText.includes("?")) {
      askedQuestions = true;
      break;
    }
  }

  if (askedQuestions) {
    issues.push({
      code: "asked_questions",
      level: "warning",
      message:
        "Assistenten stiller spørgsmål, hvilket kan være i strid med screeningsrammen.",
    });
  }

  /* ----------------------------------
     RULE: REPEATED CLOSING
  ---------------------------------- */
  if (repeatedClosing) {
    issues.push({
      code: "repeated_closing",
      level: "warning",
      message:
        "Sessionen indeholder gentagne afslutninger efter første konklusion.",
    });
  }

  /* ----------------------------------
     RESULT
  ---------------------------------- */
  return {
    sessionId: replay.sessionId,
    promptVersion: replay.promptVersion,

    totalTurns,
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
