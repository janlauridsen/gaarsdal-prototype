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

export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;

  user_text: string;

  jan_raw: string;
  jan_final: string;
  answer: string;

  evaluator_text: string | null;
  evaluator_present: boolean;

  chips_present: boolean;
  chip_clicked: string | null;

  last_user_at?: string;
  session_age_ms?: number;
  dialogue_expires_at?: string;
  resume_prompted?: boolean;

  turn_index?: number;
  user_message_length?: number;
  ai_message_length?: number;

  turn_observation?: {
    question_count?: number;
    topic_hash?: string;
  };

  turn_indicators?: {
    progression_state?: "stalled" | "advancing" | "closing";
    alignment_state?: "low" | "medium" | "high";
    stability_state?: "stable" | "drifting";
    load_estimate?: "low" | "medium" | "high";
    stop_signal_candidate?: StopSignal;
  };

  session_health?: {
    score: number;
    factors: {
      avg_load?: "low" | "medium" | "high";
      high_load_turns?: number;
      turn_count?: number;
    };
  };

  // ─────────────────────────────
  // TRIN C.6 · BLØD FEEDBACK (PASSIV)
  // ─────────────────────────────
  soft_feedback?: {
    signal: SoftFeedbackSignal;
    confidence: "low" | "medium" | "high";
    based_on_turns: number;
  };

  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
