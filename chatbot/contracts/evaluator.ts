// chatbot/contracts/evaluator.ts
// v6.3 – Evaluator Contract (LOCKED)

export type EvaluatorProgress = "lav" | "middel" | "høj";

export type EvaluatorOutcome =
  | "afklaring"
  | "kontakt"
  | "fortsæt"
  | "afslut"
  | "nyt fokus";

export interface EvaluatorChip {
  id: string;            // stabil id, fx "clarify-trigger"
  label: string;         // kort UI-tekst
  intent: string;        // hvad chippen inviterer til
  confidence: "lav" | "middel" | "høj";
}

export interface EvaluatorResult {
  summary: string;
  progress: EvaluatorProgress;
  outcome: EvaluatorOutcome;
  chips: EvaluatorChip[];
}
