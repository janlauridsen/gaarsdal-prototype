// chatbot/contracts/evaluator.ts

export type EvaluatorOutput = {
  evaluator_present: boolean;
  summary: string;
  hints: string[];
  chips: string[];
};

/**
 * CQC mapping contract
 * ─────────────────────────────
 * Mapper evaluator-signaler til observerende CQC-tilstande.
 * Ingen fortolkning. Kun eksplicitte signaler.
 */
export type EvaluatorCQCInput = {
  has_repetition_hint?: boolean;
  has_overinformation_hint?: boolean;
  has_closure_hint?: boolean;
  has_focus_drift_hint?: boolean;
};
