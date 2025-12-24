import type { EvalIssue } from "../types";
import type { EvalContext } from "../types";

/* ----------------------------------
   REDUNDANCY HEURISTIC
---------------------------------- */

/**
 * Måler tekstlig redundans mellem
 * på hinanden følgende assistant-svar.
 *
 * Simpel token-overlap heuristik.
 */
function redundancyScore(a: string, b: string): number {
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

  const aSet: Record<string, true> = {};
  for (let i = 0; i < aWords.length; i++) {
    aSet[aWords[i]] = true;
  }

  let overlap = 0;
  for (let i = 0; i < bWords.length; i++) {
    if (aSet[bWords[i]]) overlap++;
  }

  return overlap / Math.max(aWords.length, bWords.length);
}

/* ----------------------------------
   CHECK
---------------------------------- */

export function checkRedundancy(
  ctx: EvalContext
): EvalIssue[] {
  const issues: EvalIssue[] = [];
  const turns = ctx.replay.turns;

  for (let i = 1; i < turns.length; i++) {
    const prev = turns[i - 1].outputText;
    const curr = turns[i].outputText;

    if (!prev || !curr) continue;

    const score = redundancyScore(prev, curr);

    if (score > 0.6) {
      issues.push({
        code: "redundant_response",
        level: "warning",
        message:
          "Assistentens svar gentager i høj grad tidligere indhold.",
        turnIndex: turns[i].turnIndex,
      });
    }
  }

  return issues;
}
