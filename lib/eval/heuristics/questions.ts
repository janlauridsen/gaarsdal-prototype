import type { ReplayResult } from "../../playback/replay-types";
import type { EvalIssue } from "../types";

/* ----------------------------------
   QUESTION DETECTION HEURISTIC
---------------------------------- */

/**
 * Simpel indikator:
 * - Spørgsmålstegn
 * - Kendte danske spørgeord i starten af sætning
 */
function containsQuestion(text: string): boolean {
  if (!text) return false;

  const lower = text.toLowerCase();

  // 1. Direkte spørgsmålstegn
  if (lower.indexOf("?") !== -1) {
    return true;
  }

  // 2. Spørgeord (konservativ liste)
  const questionStarters = [
    "hvordan ",
    "hvad ",
    "hvor ",
    "hvornår ",
    "hvorfor ",
    "har du ",
    "har der ",
    "er der ",
    "kan du ",
    "kan det ",
    "har du ",
  ];

  // Tjek kun starten af sætninger (første ~40 tegn)
  const prefix = lower.slice(0, 40);

  for (let i = 0; i < questionStarters.length; i++) {
    if (prefix.indexOf(questionStarters[i]) !== -1) {
      return true;
    }
  }

  return false;
}

/* ----------------------------------
   CHECK QUESTIONS
---------------------------------- */

export function checkQuestions(
  replay: ReplayResult
): EvalIssue[] {
  const issues: EvalIssue[] = [];

  const { turns } = replay;

  for (let i = 0; i < turns.length; i++) {
    const assistantText = turns[i].assistantText;

    if (!assistantText) continue;

    if (containsQuestion(assistantText)) {
      issues.push({
        code: "ASSISTANT_ASKED_QUESTION",
        level: "error",
        message:
          "Assistant stillede et spørgsmål, hvilket ikke er tilladt i screening-flow.",
        turnIndex: i,
      });
    }
  }

  return issues;
}
