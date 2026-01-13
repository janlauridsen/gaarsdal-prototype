import type { Chip } from "../flow/chips";

export type PostAnalysisEntry = {
  session_id: string;
  turn_id: number;
  chip: Chip;

  analysis: {
    intent_guess?: string;
    scope_match: boolean;
    ambiguity_level: "low" | "medium" | "high";
    safety_notes?: string[];
  };

  hypotheses: string[];
  flags: {
    medical_risk: boolean;
    off_scope: boolean;
  };

  meta: {
    model_version: "v10.0";
    analysis_version: "v1";
  };
};
