import type { ReplayResult } from "../playback/replay-types";
import type { BatchEvalResult } from "./types";

import { runBatchPlayback } from "../playback/runBatchPlayback";
import { evalBatch } from "./evalBatch";

/* ----------------------------------
   BATCH EVAL RUNNER
---------------------------------- */

/**
 * Kører:
 * 1) batch playback (silent)
 * 2) evaluerer alle sessions
 *
 * Ingen persistence, ingen logging.
 * Returnerer et fuldt eval-objekt.
 */
export async function runBatchEval(
  sessionIds: string[]
): Promise<BatchEvalResult> {
  /* ----------------------------------
     PLAYBACK
  ---------------------------------- */

  const replays: ReplayResult[] =
    await runBatchPlayback(sessionIds);

  /* ----------------------------------
     EVALUATION
  ---------------------------------- */

  const batchResult = evalBatch(replays);

  return batchResult;
}
