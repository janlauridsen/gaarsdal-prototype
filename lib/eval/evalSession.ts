import type {
  PlaybackSessionResult,
  SessionEval,
  TurnEval,
} from "./types";
import { detectClosure } from "./heuristics/closure";
import { violatesStopRule } from "./heuristics/stopRule";
import { lengthDelta } from "./heuristics/length";

export function evalSession(
  session: PlaybackSessionResult
): SessionEval {
  let hasClosed = false;
  const turnEvals: TurnEval[] = [];

  for (const turn of session.turns) {
    const originalClosed = detectClosure(turn.originalAssistantText);
    const newClosed = detectClosure(turn.newAssistantText);

    const violated =
      violatesStopRule(hasClosed, newClosed);

    if (newClosed) hasClosed = true;

    turnEvals.push({
      turnIndex: turn.turnIndex,
      deltas: {
        closureChanged: originalClosed !== newClosed,
        lengthDelta: lengthDelta(
          turn.originalAssistantText,
          turn.newAssistantText
        ),
      },
      flags: {
        violatedStopRule: violated,
        askedAfterClosure: violated,
      },
    });
  }

  const anyViolation = turnEvals.some(
    (t) => t.flags.violatedStopRule
  );

  return {
    sessionId: session.sessionId,
    summary: {
      regression: anyViolation,
      improvement: false,
      neutral: !anyViolation,
    },
    flags: {
      hardRegression: anyViolation,
      needsReview: anyViolation,
    },
    turnEvals,
  };
}
