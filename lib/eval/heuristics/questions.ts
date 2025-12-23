import type { EvalContext, EvalIssue } from "../types";

export function checkQuestions(ctx: EvalContext): EvalIssue[] {
  const issues: EvalIssue[] = [];

  ctx.replay.steps.forEach((s) => {
    if (s.assistantText.includes("?")) {
      issues.push({
        code: "QUESTION_USED",
        level: "info",
        message: "Assistenten stillede et spørgsmål.",
        turnIndex: s.index,
      });
    }
  });

  return issues;
}
