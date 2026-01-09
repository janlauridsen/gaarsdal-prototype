// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

export type SoftFeedbackSignal =
  | "repeated_high_load"
  | "repeated_low_progression"
  | "repeated_misalignment"
  | "session_stalling"
  | null;

/**
 * TurnLog
 * ─────────────────────────────
 * Append-only log pr. turn
 * Ingen felt slettes.
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
  // (ingen fortolkning)
  // ─────────────────────────────
  turn_observation?: {
    question_count?: number;
    topic_hash?: string;
  };

  // ─────────────────────────────
  // TRIN B · AFLEDTE INDIKATORER
  // (passive, ikke-styrende)
  // ─────────────────────────────
  turn_indicators?: {
    progression_state?: "stalled" | "advancing" | "closing";
    alignment_state?: "low" | "medium" | "high";
    stability_state?: "stable" | "drifting";
    load_estimate?: "low" | "medium" | "high";
    stop_signal_candidate?: StopSignal;
  };

  // ─────────────────────────────
  // TRIN C.5 · SESSION HEALTH (LET)
  // ─────────────────────────────
  session_health?: {
    score: number; // 0–100
    factors: {
      avg_load?: "low" | "medium" | "high";
      high_load_turns?: number;
      turn_count?: number;
    };
  };

  // ─────────────────────────────
  // TRIN C.6 · BLØD FEEDBACK
  // (kun signal, ingen styring)
  // ─────────────────────────────
  soft_feedback?: {
    signal: SoftFeedbackSignal;
    confidence: "low" | "medium" | "high";
    based_on_turns: number;
  };

  // ───────────────
  // System
  // ───────────────
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
