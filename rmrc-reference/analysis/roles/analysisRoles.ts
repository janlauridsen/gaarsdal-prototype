/**
 * Analysis Roles
 *
 * These roles interpret logs — not users.
 * They do not generate user-facing text.
 */

export interface AnalysisRole {
  roleId: string;
  purpose: string;
  input: "runtime_logs";
  output: "analysis_notes";
}

export const analysisRoles: AnalysisRole[] = [
  {
    roleId: "dialog_coherence_evaluator",
    purpose:
      "Assess whether the dialog maintained coherence and thematic continuity across turns.",
    input: "runtime_logs",
    output: "analysis_notes",
  },
  {
    roleId: "missed_intervention_detector",
    purpose:
      "Identify moments where an alternative role or board could have been legitimately activated.",
    input: "runtime_logs",
    output: "analysis_notes",
  },
  {
    roleId: "experience_quality_reflector",
    purpose:
      "Reflect on the user's likely experience with respect to feeling met, understood, and safe.",
    input: "runtime_logs",
    output: "analysis_notes",
  },
];
