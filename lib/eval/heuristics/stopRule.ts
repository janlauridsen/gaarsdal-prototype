import type { EvalIssue } from "../types";
import type { EvalContext } from "../types";

/* ----------------------------------
   STOP RULE
---------------------------------- */

/**
 * Evaluerer om sessionen burde være stoppet
 * tidligere efter første konklusion.
 */
export function checkStopRule(
  ctx: EvalContext
): EvalIssue[] {
  const issues: EvalIssue[] = [];
  const { replay } = ctx;

  const { hasClosing, closingTurnIndex } = replay.summary;
  const turns = replay.turns;

  if (!hasClosing || closingTurnIndex === undefined) {
    return issues;
  }

  // Hvis der er turns EFTER closing
  if (closingTurnIndex < turns.length - 1) {
    issues.push({
      code: "continued_after_closing",
      level: "warning",
      message:
        "Sessionen fortsætter efter første afsluttende konklusion.",
      turnIndex: closingTurnIndex,
    });
  }

  return issues;
}
