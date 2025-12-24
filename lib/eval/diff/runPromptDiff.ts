import { evalBatch } from "../evalBatch";
import { diffEval } from "./diffEval";
import type { PromptDiffResult } from "./diffTypes";
import type { ReplayResult } from "../../playback/replay-types";

/* ----------------------------------
   RUN PROMPT DIFF (BATCH)
---------------------------------- */

/**
 * Kører batch-evaluering på to sæt replays
 * og sammenligner resultaterne.
 *
 * Bruges til:
 * - prompt-sammenligning
 * - regression-tests
 * - kvalitetsmåling over tid
 */
export async function runPromptDiff(params: {
  base: ReplayResult[];
  compare: ReplayResult[];
}): Promise<PromptDiffResult> {
  const { base, compare } = params;

  // 1. Evaluer begge batches
  const baseEval = evalBatch(base);
  const compareEval = evalBatch(compare);

  // 2. Diff resultaterne
  const diff = diffEval(baseEval, compareEval);

  return {
    base: baseEval,
    compare: compareEval,
    diff,
  };
}
