
// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

/**
 * TurnLog
 * ─────────────────────────────
 * Primær, append-only log pr. turn
 * Alle nye felter er optionelle
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
  // TRIN 1 · OBSERVABILITY (session)
  // ─────────────────────────────
  last_user_at?: string;
  session_age_ms?: number;
  dialogue_expires_at?: string;
  resume_prompted?: boolean;

  // ─────────────────────────────
  // TRIN 3 · RÅ MÅLINGER (turn)
  // (objektive, billige)
  // ─────────────────────────────
  turn_index?: number;
  user_message_length?: number;
  ai_message_length?: number;

  // ─────────────────────────────
  // TRIN 4 · TURN-OBSERVATIONER
  // (ingen fortolkning)
  // ─────────────────────────────
  turn_observation?: {
    question_count?: number;
    topic_hash?: string;
    repetition_score?: number;
  };

  // ─────────────────────────────
  // TRIN 5 · AFLEDTE INDIKATORER
  // (AI-baseret, ikke-styrende)
  // ─────────────────────────────
  turn_indicators?: {
    progression_state?: "stalled" | "advancing" | "closing";
    alignment_state?: "low" | "medium" | "high";
    stability_state?: "stable" | "drifting";
    load_estimate?: "low" | "medium" | "high";
    intent_state?:
      | "info"
      | "afklaring"
      | "beslutning"
      | "handling"
      | "afslutning";
    stop_signal_candidate?: StopSignal;
  };

  // ─────────────────────────────
  // TRIN 6 · FLOW-JUSTERING
  // (kun registrering – ingen styring)
  // ─────────────────────────────
  flow_adjustment?: {
    applied?: boolean;
    strategy?:
      | "none"
      | "summarize_only"
      | "reduce_questions"
      | "shorten_response"
      | "simplify_language"
      | "clarify_one_point"
      | "choose_one_topic"
      | "pause_or_close";
  };

  // ───────────────
  // System
  // ───────────────
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
