import { replaySession } from "../playback/replay-session";
import type { ReplayResult } from "../playback/replay-types";

import { evalBatch } from "./evalBatch";
import type { BatchEvalResult } from "./types";

/**
 * Kører batch playback + eval for et sæt sessionIds
 * – helt silent
 * – ingen skrivning
 * – deterministisk
 */
export async function runBatchEval(params: {
  sessionIds: string[];
  promptVersion: string;
  model: string;
}): Promise<BatchEvalResult> {
  const { sessionIds, promptVersion, model } = params;

  const replays: ReplayResult[] = [];

  for (const sessionId of sessionIds) {
    try {
      const replay = await replaySession({
        sessionId,
        promptVersion,
        model,
      });

      replays.push(replay);
    } catch (err) {
      // Hvis en session fejler, ignorerer vi den
      // (kan senere tælles som errorSessions)
      console.warn("Replay failed for session:", sessionId, err);
    }
  }

  const batchEval = evalBatch(replays);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      promptVersion,
      model,
      totalSessions: replays.length,
    },
    aggregates: {
      withClosing: batchEval.aggregates.withClosing,
      repeatedClosing: batchEval.aggregates.repeatedClosing,
      askedQuestions: batchEval.aggregates.askedQuestions,
      excessiveLength: batchEval.aggregates.excessiveLength,
      errorSessions: sessionIds.length - replays.length,
    },
    sessions: batchEval.sessions.map((s) => ({
      sessionId: s.replay.sessionId,
      replay: {
        totalTurns: s.replay.turns.length,
        closingTurnIndex: s.replay.closingTurnIndex,
      },
      eval: s.eval,
    })),
  };
}
