import type { EvalContext, EvalIssue } from "../types";

export function checkClosure(ctx: EvalContext): EvalIssue[] {
  const steps = ctx.replay.steps;
  const closings = steps.filter((s) => s.isClosing);

  if (closings.length === 0) {
    return [
      {
        code: "NO_CLOSING",
        level: "warning",
        message: "Sessionen blev aldrig tydeligt lukket.",
      },
    ];
  }

  if (closings.length > 1) {
    return [
      {
        code: "REPEATED_CLOSING",
        level: "info",
        message: "Sessionen blev lukket flere gange.",
      },
    ];
  }

  return [];
}
