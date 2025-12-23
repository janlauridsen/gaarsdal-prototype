import type { ReplayResult } from "../../playback/replay-types";
import type { EvalIssue } from "../types";

/* ----------------------------------
   CLOSURE HEURISTIC
---------------------------------- */

/**
 * Kontrollerer om:
 * - sessionen bliver lukket
 * - lukningen sker flere gange
 * - lukningen sker ekstremt tidligt
 */
export function checkClosure(
  replay: ReplayResult
): EvalIssue[] {
  const issues: EvalIssue[] = [];

  const { hasClosing, closingTurnIndex, repeatedClosing } =
    replay.summary;

  /* -----------------------------
     MANGLENDE LUKNING
  ----------------------------- */

  if (!hasClosing) {
    issues.push({
      code: "NO_CLOSING",
      level: "warning",
      message:
        "Sessionen afsluttes ikke eksplicit med en klar konklusion.",
    });
    return issues;
  }

  /* -----------------------------
     GENTAGEN LUKNING
  ----------------------------- */

  if (repeatedClosing) {
    issues.push({
      code: "REPEATED_CLOSING",
      level: "warning",
      message:
        "Sessionen afsluttes flere gange efter hinanden.",
      turnIndex: closingTurnIndex,
    });
  }

  /* -----------------------------
     FOR TIDLIG LUKNING
  ----------------------------- */

  if (
    typeof closingTurnIndex === "number" &&
    closingTurnIndex === 0
  ) {
    issues.push({
      code: "CLOSING_TOO_EARLY",
      level: "info",
      message:
        "Sessionen afsluttes allerede ved første brugerhenvendelse.",
      turnIndex: closingTurnIndex,
    });
  }

  return issues;
}
