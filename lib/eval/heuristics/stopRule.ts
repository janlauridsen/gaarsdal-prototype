import type { EvalContext, EvalIssue } from "../types";

export function checkStopRule(ctx: EvalContext): EvalIssue[] {
  const steps = ctx.replay.steps;

  const firstClosing = steps.find((s) => s.isClosing);
  if (!firstClosing) return [];

  const after = steps.filter((s) => s.index > firstClosing.index);

  if (after.length > 0) {
    return [
      {
        code: "POST_CLOSING_TURNS",
        level: "warning",
        message: "Der kom flere svar efter lukning.",
      },
    ];
  }

  return [];
}
