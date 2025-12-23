import type { EvalContext, EvalIssue } from "../types";

const MAX_ASSISTANT_CHARS = 900;

export function checkLength(ctx: EvalContext): EvalIssue[] {
  const issues: EvalIssue[] = [];

  ctx.replay.steps.forEach((s) => {
    if (s.assistantText.length > MAX_ASSISTANT_CHARS) {
      issues.push({
        code: "LONG_RESPONSE",
        level: "info",
        message: "Svar er relativt langt.",
        turnIndex: s.index,
      });
    }
  });

  return issues;
}
