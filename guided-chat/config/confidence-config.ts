// guided-chat/config/confidence-config.ts

export type ConfidenceDimension =
  | "problem_understanding"
  | "state_alignment"
  | "signal_clarity"
  | "stability";

export interface ConfidenceConfig {
  dimension: ConfidenceDimension;
  initialValue: number;
  min: number;
  max: number;
  summaryThreshold: number;
  recoveryThreshold: number;
  escalationThreshold: number;
}

export const CONFIDENCE_CONFIG: ConfidenceConfig[] = [
  {
    dimension: "problem_understanding",
    initialValue: 0.5,
    min: 0.0,
    max: 1.0,
    summaryThreshold: 0.6,
    recoveryThreshold: 0.4,
    escalationThreshold: 0.3
  },
  {
    dimension: "state_alignment",
    initialValue: 0.7,
    min: 0.0,
    max: 1.0,
    summaryThreshold: 0.6,
    recoveryThreshold: 0.4,
    escalationThreshold: 0.3
  },
  {
    dimension: "signal_clarity",
    initialValue: 0.6,
    min: 0.0,
    max: 1.0,
    summaryThreshold: 0.5,
    recoveryThreshold: 0.35,
    escalationThreshold: 0.25
  },
  {
    dimension: "stability",
    initialValue: 0.8,
    min: 0.0,
    max: 1.0,
    summaryThreshold: 0.6,
    recoveryThreshold: 0.4,
    escalationThreshold: 0.3
  }
];

export function getConfidenceConfig(
  dimension: ConfidenceDimension
): ConfidenceConfig | undefined {
  return CONFIDENCE_CONFIG.find(c => c.dimension === dimension);
}
