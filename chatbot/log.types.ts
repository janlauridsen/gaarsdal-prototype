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
 * TurnObservation
 * ─────────────────────────────
 * Lav-niveau runtime-observationer.
 */
export type TurnObservation = {
  question_count?: number;
  topic_hash?: string;
};

/**
 * TurnIndicators
 * ─────────────────────────────
 * Rå, tekniske indikatorer pr. turn.
 */
export type TurnIndicators = {
  load_estimate?: "low" | "medium" | "high" | string;
};

/**
 * SessionHealthSnapshot
 * ─────────────────────────────
 * Runtime snapshot af session health.
 */
export type SessionHealthSnapshot = {
  score?: number;
  factors?: Record<string, unknown>;
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
   * Runtime aliases / telemetry (chat.ts)
   */
  user_text?: string;
  jan_raw?: string;
  jan_final?: string;
  answer?: string;

  evaluator_text?: string;
  chips_present?: boolean;
  chip_clicked?: string | null;

  turn_index?: number;
  user_message_length?: number;
  ai_message_length?: number;

  /**
   * Turn-level observation
   */
  turn_observation?: TurnObservation;

  /**
   * Turn-level indicators
   */
  turn_indicators?: TurnIndicators;

  /**
   * Session runtime snapshot (alias)
   */
  session_health?: SessionHealthSnapshot;
  last_user_at?: string;
  session_age_ms?: number;

  // ───────────────
  // Evaluator (struktureret)
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
  // Session (struktureret)
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

