import type { BatchEvalResult, SessionEval } from "../types";

export function diffEval(
  base: BatchEvalResult,
  compare: BatchEvalResult
) {
  const byId = new Map<string, SessionEval>(
    base.sessions.map((s) => [s.replay.sessionId, s])
  );

  const perSession = [];

  for (const cmp of compare.sessions) {
    const baseSession = byId.get(cmp.replay.sessionId);
    if (!baseSession) continue;

    perSession.push({
      sessionId: cmp.replay.sessionId,
      base: baseSession.eval,
      compare: cmp.eval,
    });
  }

  return {
    totalCompared: perSession.length,
    perSession,
  };
}
