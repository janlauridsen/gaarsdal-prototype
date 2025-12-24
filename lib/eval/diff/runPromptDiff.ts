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
 */
export async function runPromptDiff(params: {
  base: ReplayResult[];
  compare: ReplayResult[];
}): Promise<PromptDiffResult> {
  const { base, compare } = params;

  if (base.length === 0 || compare.length === 0) {
    throw new Error("runPromptDiff kræver non-empty replay batches");
  }

  // Antag ens prompt/model pr. batch (designregel)
  const baseMeta = {
    promptVersion: base[0].promptVersion,
    model: base[0].model,
  };

  const compareMeta = {
    promptVersion: compare[0].promptVersion,
    model: compare[0].model,
  };

  // 1. Evaluer begge batches
  const baseEval = evalBatch(base);
  const compareEval = evalBatch(compare);

  // 2. Diff resultaterne
  const diff = diffEval(baseEval, compareEval);

  return {
    base: {
      ...baseMeta,
      eval: baseEval,
    },
    compare: {
      ...compareMeta,
      eval: compareEval,
    },
    diff,
  };
}
