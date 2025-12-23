import type { ReplayResult } from "../../playback/replay-types";
import type { EvalIssue } from "../types";

/* ----------------------------------
   STOP-RULE HEURISTIC
---------------------------------- */

/**
 * Kontrollerer om modellen fortsætter
 * med fagligt indhold EFTER at den
 * har lukket screeningen.
 */
export function checkStopRule(
  replay: ReplayResult
): EvalIssue[] {
  const issues: EvalIssue[] = [];

  const {
    closingTurnIndex,
    turns,
    summary,
  } = replay;

  if (
    !summary.hasClosing ||
    typeof closingTurnIndex !== "number"
  ) {
    // Ingen lukning → stop-regel irrelevant
    return issues;
  }

  /* -----------------------------
     EFTERFØLGENDE ASSISTENT-SVAR
  ----------------------------- */

  for (let i = closingTurnIndex + 1; i < turns.length; i++) {
    const turn = turns[i];

    // Vi reagerer kun på assistant-svar
    if (!turn.assistantText) continue;

    issues.push({
      code: "STOP_RULE_VIOLATION",
      level: "error",
      message:
        "Modellen fortsætter med svar efter at screeningen er afsluttet.",
      turnIndex: i,
    });

    // Én fejl er nok – resten er støj
    break;
  }

  return issues;
}
