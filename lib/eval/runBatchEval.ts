import type { BatchEvalResult } from "./types";
import type { LoggedSession } from "../playback/replay-types";

import { runPlaybackSession } from "../playback/runPlaybackSession";
import { evalSession } from "./evalSession";

/* ----------------------------------
   RUN BATCH EVALUATION
---------------------------------- */

/**
 * Kører eval på en liste af loggede sessioner.
 * Ingen netværkskald – batch-input er allerede hentet.
 */
export function runBatchEval(params: {
  sessions: LoggedSession[];
  systemPrompt: string;
}): BatchEvalResult {
  const { sessions, systemPrompt } = params;

  const results = [];
  let withClosing = 0;
  let repeatedClosing = 0;
  let askedQuestions = 0;
  let excessiveLength = 0;

  for (const session of sessions) {
    const replay = runPlaybackSession(session, systemPrompt);
    const evalResult = evalSession(replay);

    results.push({
      replay,
      eval: evalResult,
    });

    if (evalResult.summary.hasClosing) withClosing++;
    if (evalResult.summary.repeatedClosing) repeatedClosing++;
    if (evalResult.summary.askedQuestions) askedQuestions++;
    if (evalResult.summary.excessiveLength) excessiveLength++;
  }

  return {
    totalSessions: sessions.length,
    sessions: results,
    aggregates: {
      withClosing,
      repeatedClosing,
      askedQuestions,
      excessiveLength,
    },
  };
}
