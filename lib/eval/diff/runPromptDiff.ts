import { evalBatch } from "../evalBatch";
import { diffBatchEval } from "./diffEval";
import type { PromptDiffResult } from "./diffTypes";


export async function runPromptDiff(params: {
  sessionIds: string[];
  base: {
    promptVersion: string;
    model: string;
  };
  compare: {
    promptVersion: string;
    model: string;
  };
}): Promise<PromptDiffResult> {
  const baseEval = await runBatchEval({
    sessionIds: params.sessionIds,
    promptVersion: params.base.promptVersion,
    model: params.base.model,
  });

  const compareEval = await runBatchEval({
    sessionIds: params.sessionIds,
    promptVersion: params.compare.promptVersion,
    model: params.compare.model,
  });

  return diffBatchEval(baseEval, compareEval);
}
