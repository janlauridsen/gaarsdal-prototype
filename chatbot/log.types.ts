// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

/**
 * CQCState
 * ─────────────────────────────
 * Conversation Quality Control.
 * Normativ kvalitetsvurdering pr. turn.
 */
export type CQCState = {
  progress?: "good" | "neutral" | "stagnating";
  redundancy?: "low" | "rising" | "high";
  responsiveness?: "high" | "drifting";
  closure?: "possible" | "blocked";
  meta_noise?: "low" | "elevated";
};

/**
 * RuntimeTelemetry
 * ─────────────────────────────
 * Ustruktureret runtime-data.
 * Eksperimentel. Append-only. Ikke normativ.
 */
export type RuntimeTelemetry = Record<string, unknown>;

/**
 * TurnLog
 * ─────────────────────────────
 * Stabil, normativ kontrakt.
 */
export type TurnLog = {
  // Identitet
  session_id: string;
  turn_id: number;
  timestamp: string;

  // Kanonisk indhold
  user_input: string;
  jan_raw_output: string;
  jan_final_output: string;

  // Evaluator (struktureret)
  evaluator_present: boolean;
  evaluator_summary?: string;
  evaluator_hints?: string[];
  evaluator_chips?: string[];

  // CQC (struktureret)
  cqc?: CQCState;

  // Session (struktureret)
  session?: {
    stop_signal?: StopSignal;
    health?: {
      score: number;
      factors: {
        avg_load?: "low" | "medium" | "high";
        high_load_turns?: number;
        turn_count?: number;
      };
    };
  };

  // Runtime telemetry (ALT andet)
  telemetry?: RuntimeTelemetry;

  // System
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
