/**
 * Analysis Board
 *
 * Operates ONLY on completed session logs.
 * Never invoked during runtime.
 */

export interface AnalysisBoard {
  boardId: "analysis";
  allowedRoles: string[];
}

export const analysisBoard: AnalysisBoard = {
  boardId: "analysis",
  allowedRoles: [
    "dialog_coherence_evaluator",
    "missed_intervention_detector",
    "experience_quality_reflector",
  ],
};
