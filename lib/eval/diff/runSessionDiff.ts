import type { ReplayResult } from "../../playback/replay-types";
import { runPromptDiff } from "./runPromptDiff";
import type { PromptDiffResult } from "./diffTypes";

/**
 * Wrapper til single-session diff.
 * Bruges af API-lag.
 */
export async function runSessionDiff(params: {
  base: ReplayResult;
  compare: ReplayResult;
}): Promise<PromptDiffResult> {
  return await runPromptDiff({
    base: [params.base],
    compare: [params.compare],
  });
}
