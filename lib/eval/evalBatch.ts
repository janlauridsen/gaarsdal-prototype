// lib/eval/evalBatch.ts

import type {
  BatchEvalResult,
  SessionEval,
} from "./types";

import type {
  BatchPlaybackResult,
} from "../playback/types";

import { evalSession } from "./evalSession";

export function evalBatch(
  playback: BatchPlaybackResult
): BatchEvalResult {
  const sessions: SessionEval[] =
    playback.sessions.map(evalSession);

  const regressions = sessions.filter(
    (s) => s.summary.regression
  ).length;

  const improvements = sessions.filter(
    (s) => s.summary.improvement
  ).length;

  const neutral = sessions.filter(
    (s) => s.summary.neutral
  ).length;

  return {
    batchId: playback.batchId,
    evalVersion: "baseline-v1.1",
    evaluatedAt: new Date().toISOString(),
    totals: {
      sessions: sessions.length,
      regressions,
      improvements,
      neutral,
    },
    sessions,
  };
}
