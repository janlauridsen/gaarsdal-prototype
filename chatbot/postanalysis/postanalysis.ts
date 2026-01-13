import { V10Chip } from "../chips"

export type PostAnalysisEntry = {
  session_id: string
  turn_id: number
  chip: V10Chip

  analysis: {
    intent_guess?: string        // løs hypotese
    scope_match: boolean         // var svaret inden for 1–3
    ambiguity_level: "low" | "medium" | "high"
    safety_notes?: string[]
  }

  hypotheses: string[]           // fx “søvn + stress-relateret”
  flags: {
    medical_risk: boolean
    off_scope: boolean
  }

  meta: {
    model_version: "v10.0"
    analysis_version: "v1"
  }
}
