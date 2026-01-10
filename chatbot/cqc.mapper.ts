// chatbot/cqc.mapper.ts
import { CQCState } from "./log.types";
import { EvaluatorCQCInput } from "./contracts/evaluator";

export function mapEvaluatorToCQC(
  input: EvaluatorCQCInput
): CQCState | undefined {
  if (!input) return undefined;

  const cqc: CQCState = {};

  if (input.has_repetition_hint) {
    cqc.progress = "stagnating";
    cqc.redundancy = "high";
  }

  if (input.has_overinformation_hint) {
    cqc.meta_noise = "elevated";
  }

  if (input.has_focus_drift_hint) {
    cqc.responsiveness = "drifting";
  }

  if (input.has_closure_hint) {
    cqc.closure = "possible";
  }

  return Object.keys(cqc).length > 0 ? cqc : undefined;
}
