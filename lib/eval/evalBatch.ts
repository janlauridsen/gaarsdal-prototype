import type { ReplayResult } from "../playback/replay-types";
import type {
  BatchEvalResult,
  SessionEval,
} from "./types.ts";


import { evalSession } from "./evalSession";

export function evalBatch(
  replays: ReplayResult[]
): BatchEvalResult {
  const sessions: SessionEval[] = [];

  let withClosing = 0;
  let repeatedClosing = 0;
  let askedQuestions = 0;
  let excessiveLength = 0;

  for (let i = 0; i < replays.length; i++) {
    const replay = replays[i];
    const evalResult = evalSession(replay);

    sessions.push({
      replay,
      eval: evalResult,
    });

    if (evalResult.summary.hasClosing) withClosing++;
    if (evalResult.summary.repeatedClosing) repeatedClosing++;
    if (evalResult.summary.askedQuestions) askedQuestions++;
    if (evalResult.summary.excessiveLength) excessiveLength++;
  }

  return {
    totalSessions: replays.length,
    sessions,
    aggregates: {
      withClosing,
      repeatedClosing,
      askedQuestions,
      excessiveLength,
    },
  };
}
