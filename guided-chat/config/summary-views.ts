// guided-chat/config/summary-views.ts

export type SummaryScope =
  | "state"
  | "task"
  | "global";

export interface SummaryViewConfig {
  id: string;
  scope: SummaryScope;
  includedMetaDomains: string[];
  requiredConfidence: {
    dimension: string;
    minValue: number;
  };
  purpose: string;
}

export const SUMMARY_VIEWS: SummaryViewConfig[] = [
  {
    id: "initial_understanding",
    scope: "session",
    includedMetaDomains: [
      "initial_intent",
      "problem_model"
    ],
    requiredConfidence: {
      dimension: "problem_understanding",
      minValue: 0.0
    },
    purpose: "Synkroniserer systemets første forståelse med brugeren"
  },
  {
    id: "triage_summary",
    scope: "task",
    includedMetaDomains: [
      "problem_model",
      "triage_result"
    ],
    requiredConfidence: {
      dimension: "problem_understanding",
      minValue: 0.3
    },
    purpose: "Opsummerer triage-resultat før næste skridt"
  }
];

export function getSummaryView(
  id: string
): SummaryViewConfig | undefined {
  return SUMMARY_VIEWS.find(v => v.id === id);
}
