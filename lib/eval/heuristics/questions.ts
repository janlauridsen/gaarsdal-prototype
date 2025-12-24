import type { EvalIssue } from "../types";
import type { EvalContext } from "../types";

/* ----------------------------------
   QUESTIONS HEURISTIC
---------------------------------- */

/**
 * Detekterer om assistenten stiller spørgsmål,
 * hvilket som udgangspunkt er uønsket i screening.
 */
export function checkQuestions(
  ctx: EvalContext
): EvalIssue[] {
  const issues: EvalIssue[] = [];

  const turns = ctx.replay.turns;

  for (let i = 0; i < turns.length; i++) {
    const text = turns[i].outputText;
    if (!text) continue;

    // Simpel, bevidst konservativ heuristik
    if (text.includes("?")) {
      issues.push({
        code: "asked_question",
        level: "warning",
        message:
          "Assistenten stiller spørgsmål, hvilket kan være i strid med screeningsrammen.",
        turnIndex: turns[i].turnIndex,
      });
    }
  }

  return issues;
}
