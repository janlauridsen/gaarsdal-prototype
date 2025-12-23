// lib/eval/evalSession.ts

import type {
  PlaybackSessionResult,
  SessionEval,
  TurnEval,
} from "./types";

import { detectClosure } from "./heuristics/closure";
import { violatesStopRule } from "./heuristics/stopRule";
import { lengthDelta } from "./heuristics/length";
import { redundancyScore } from "./heuristics/redundancy";
import { countQuestions } from "./heuristics/questions";
import { containsAdvisoryLanguage } from "./heuristics/clinical";

export function evalSession(
  session: PlaybackSessionResult
): SessionEval {
  let hasClosed = false;
  const turnEvals: TurnEval[] = [];

  for (const turn of session.turns) {
    const originalClosed = detectClosure(
      turn.originalAssistantText
    );
    const newClosed = detectClosure(
      turn.newAssistantText
    );

    const violatedStop =
      violatesStopRule(hasClosed, newClosed);

    if (newClosed) {
      hasClosed = true;
    }

    const questionsOriginal = countQuestions(
      turn.originalAssistantText
    );
    const questionsNew = countQuestions(
      turn.newAssistantText
    );

    const redundancy = redundancyScore(
      turn.originalAssistantText,
      turn.newAssistantText
    );

    const advisory = containsAdvisoryLanguage(
      turn.newAssistantText
    );

    const turnEval: TurnEval = {
      turnIndex: turn.turnIndex,
      deltas: {
        closureChanged:
          originalClosed !== newClosed,
        lengthDelta: lengthDelta(
          turn.originalAssistantText,
          turn.newAssistantText
        ),
        questionsAdded:
          Math.max(
            0,
            questionsNew - questionsOriginal
          ),
        questionsRemoved:
          Math.max(
            0,
            questionsOriginal - questionsNew
          ),
      },
      flags: {
        violatedStopRule: violatedStop,
        askedAfterClosure: violatedStop,
        advisoryLanguage: advisory,
      },
      notes:
        redundancy > 0.7
          ? "Høj tekstlig redundans"
          : undefined,
    };

    turnEvals.push(turnEval);
  }

  const anyStopViolation = turnEvals.some(
    (t) => t.flags.violatedStopRule
  );

  const hasAdvisory = turnEvals.some(
    (t) => t.flags.advisoryLanguage
  );

  const highRedundancy = turnEvals.some(
    (t) => t.notes === "Høj tekstlig redundans"
  );

  const regression =
    anyStopViolation || hasAdvisory;

  return {
    sessionId: session.sessionId,
    summary: {
      regression,
      improvement: false,
      neutral: !regression,
    },
    flags: {
      hardRegression: anyStopViolation,
      needsReview:
        hasAdvisory || highRedundancy,
    },
    turnEvals,
  };
}
