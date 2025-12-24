import type { EvalIssue } from "../types";
import type { EvalContext } from "../types";

/* ----------------------------------
   LENGTH HEURISTIC
---------------------------------- */

const MAX_ASSISTANT_CHARS = 600;

export function checkLength(
  ctx: EvalContext
): EvalIssue[] {
  const issues: EvalIssue[] = [];

  for (const turn of ctx.replay.turns) {
    if (turn.outputText.length > MAX_ASSISTANT_CHARS) {
      issues.push({
        code: "long_response",
        level: "warning",
        message:
          "Assistentens svar er usædvanligt langt i forhold til screeningsformålet.",
        turnIndex: turn.turnIndex,
      });
    }
  }

  return issues;
}

