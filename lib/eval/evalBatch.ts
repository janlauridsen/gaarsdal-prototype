import type {
  BatchEvalResult,
  SessionEval,
} from "./types";
import { evalSession } from "./evalSession";
import type { BatchPlaybackResult } from "../playback/types";

export function evalBatch(
  playback: BatchPlaybackResult
): BatchEvalResult {
  const sessions: SessionEval[] =
    playback.sessions.map(evalSession);

  const regressions = sessions.filter(
    (s) => s.summary.regression
  ).length;

  const neutral = sessions.filter(
    (s) => s.summary.neutral
  ).length;

  return {
    batchId: playback.batchId,
    evalVersion: "baseline-v1",
    evaluatedAt: new Date().toISOString(),
    totals: {
      sessions: sessions.length,
      regressions,
      improvements: 0,
      neutral,
    },
    sessions,
  };
}
