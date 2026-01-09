// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

export type LoadLevel = "low" | "medium" | "high";

/**
 * TurnLog
 * ─────────────────────────────
 * Append-only log pr. turn
 */
export type TurnLog = {
  // ───────────────
  // Identitet
  // ───────────────
  timestamp: string;
  session_id: string;
  turn_id: number;

  // ───────────────
  // Bruger / svar
  // ───────────────
  user_text: string;

  jan_raw: string;
  jan_final: string;
  answer: string;

  evaluator_text: string | null;
  evaluator_present: boolean;

  chips_present: boolean;
  chip_clicked: string | null;

  // ─────────────────────────────
  // SESSION OBSERVATION
  // ─────────────────────────────
  last_user_at?: string;
  session_age_ms?: number;
  dialogue_expires_at?: string;
  resume_prompted?: boolean;

  // ─────────────────────────────
  // TRIN A · RÅ MÅLINGER
  // ─────────────────────────────
  turn_index?: number;
  user_message_length?: number;
  ai_message_length?: number;

  // ─────────────────────────────
  // TRIN A · TURN-OBSERVATION
  // ─────────────────────────────
  turn_observation?: {
    question_count?: number;
    topic_hash?: string;
  };

  // ─────────────────────────────
  // TRIN B · AFLEDTE INDIKATORER
  // ─────────────────────────────
  turn_indicators?: {
    progression_state?: "stalled" | "advancing" | "closing";
    alignment_state?: "low" | "medium" | "high";
    stability_state?: "stable" | "drifting";
    load_estimate?: LoadLevel;
    stop_signal_candidate?: StopSignal;
  };

  // ─────────────────────────────
  // TRIN C · SESSION-NIVEAU (blød)
  // ─────────────────────────────
  session_health?: {
    score: number;
    factors: {
      avg_load?: LoadLevel;
      high_load_turns?: number;
      turn_count?: number;
    };
  };

  soft_feedback?: {
    note: string;
    severity: "info" | "warning";
  };

  // ───────────────
  // System
  // ───────────────
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
