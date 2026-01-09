// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

/**
 * CQCState
 * ─────────────────────────────
 * Conversation Quality Control
 * Observerende kvalitets-tilstand pr. turn.
 */
export type CQCState = {
  progress?: "good" | "neutral" | "stagnating";
  redundancy?: "low" | "rising" | "high";
  responsiveness?: "high" | "drifting";
  closure?: "possible" | "blocked";
  meta_noise?: "low" | "elevated";
};

/**
 * TurnLog
 * ─────────────────────────────
 * Append-only log pr. turn.
 */
export type TurnLog = {
  // ───────────────
  // Identitet
  // ───────────────
  session_id: string;
  turn_id: number;
  timestamp: string;

  // ───────────────
  // Bruger / AI (kanoniske felter)
  // ───────────────
  user_input: string;
  jan_raw_output: string;
  jan_final_output: string;

  /**
   * Runtime aliases
   * ─────────────────
   * Bruges af chat.ts.
   * Bevares for kompatibilitet.
   */
  user_text?: string;
  jan_raw?: string;
  jan_final?: string;
  answer?: string;

  // ───────────────
  // Evaluator
  // ───────────────
  evaluator_present: boolean;
  evaluator_summary?: string;
  evaluator_hints?: string[];
  evaluator_chips?: string[];

  /**
   * CQC
   * Observerende kvalitetsvurdering pr. turn.
   */
  cqc?: CQCState;

  // ───────────────
  // Session
  // ───────────────
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

  // ───────────────
  // System
  // ───────────────
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
