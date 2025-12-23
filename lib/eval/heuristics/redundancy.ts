import type { EvalContext, EvalIssue } from "../types";

export function checkRedundancy(ctx: EvalContext): EvalIssue[] {
  const issues: EvalIssue[] = [];
  let last = "";

  ctx.replay.steps.forEach((s) => {
    if (last && s.assistantText === last) {
      issues.push({
        code: "DUPLICATE_RESPONSE",
        level: "warning",
        message: "Assistenten gentog samme svar.",
        turnIndex: s.index,
      });
    }
    last = s.assistantText;
  });

  return issues;
}
