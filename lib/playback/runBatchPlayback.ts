import type {
  LoggedSession,
  ReplayResult,
} from "./replay-types";

import { runPlaybackSession } from "./runPlaybackSession";

/* ----------------------------------
   RUN BATCH PLAYBACK
---------------------------------- */

/**
 * Kører silent playback for et batch af sessions.
 *
 * Bruges til:
 * - evalBatch
 * - compare
 * - regression-tests
 *
 * Ingen side effects.
 */
export function runBatchPlayback(
  sessions: LoggedSession[],
  systemPrompt: string
): ReplayResult[] {
  const results: ReplayResult[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];

    try {
      const replay = runPlaybackSession(
        session,
        systemPrompt
      );
      results.push(replay);
    } catch {
      // Hvis én session fejler, stopper vi ikke batch
      // (eval kan senere markere den som defekt)
    }
  }

  return results;
}
