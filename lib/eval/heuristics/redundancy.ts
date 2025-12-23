import type { ReplayResult } from "../../playback/replay-types";
import type { EvalIssue } from "../types";

/* ----------------------------------
   REDUNDANCY HEURISTIC
---------------------------------- */

/**
 * Meget enkel overlap-score baseret på ord.
 * 0.0 = ingen overlap
 * 1.0 = identisk indhold
 */
function wordOverlap(a: string, b: string): number {
  const aWords = a
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const bWords = b
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (aWords.length === 0 || bWords.length === 0) {
    return 0;
  }

  const seen: { [key: string]: boolean } = {};
  let overlap = 0;

  for (let i = 0; i < aWords.length; i++) {
    seen[aWords[i]] = true;
  }

  for (let j = 0; j < bWords.length; j++) {
    if (seen[bWords[j]]) {
      overlap++;
    }
  }

  return overlap / Math.max(aWords.length, bWords.length);
}

/* ----------------------------------
   CHECK REDUNDANCY
---------------------------------- */

export function checkRedundancy(
  replay: ReplayResult
): EvalIssue[] {
  const issues: EvalIssue[] = [];
  const { turns } = replay;

  let previousAssistantText: string | null = null;

  for (let i = 0; i < turns.length; i++) {
    const current = turns[i].assistantText;
    if (!current) continue;

    if (previousAssistantText) {
      const score = wordOverlap(
        previousAssistantText,
        current
      );

      // Tærskel: 60% overlap
      if (score >= 0.6) {
        issues.push({
          code: "REDUNDANT_RESPONSE",
          level: "warning",
          message:
            "Assistant gentager i høj grad tidligere svar.",
          turnIndex: i,
        });
      }
    }

    previousAssistantText = current;
  }

  return issues;
}
