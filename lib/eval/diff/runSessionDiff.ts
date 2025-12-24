import type { ReplayResult } from "../../playback/replay-types";
import { runPromptDiff } from "./runPromptDiff";
import type { PromptDiffResult } from "./diffTypes";

/**
 * Wrapper til single-session diff.
 * Bruges af API-lag.
 */
export function runSessionDiff(params: {
  base: ReplayResult;
  compare: ReplayResult;
}): PromptDiffResult {
  return runPromptDiff({
    base: [params.base],
    compare: [params.compare],
  });
}
