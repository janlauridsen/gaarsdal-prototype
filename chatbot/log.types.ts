// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

/**
 * TurnLog
 * ─────────────────────────────
 * Append-only log pr. turn.
 *
 * PRINCIP:
 * - Felter kan være udfyldt uden at være brugt.
 * - Ingen felter slettes – kun udfases.
 * - Future-use felter må IKKE påvirke runtime-adfærd.
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
  // SESSION OBSERVATION (AKTIV)
  // ─────────────────────────────
  last_user_at?: string;
  session_age_ms?: number;
  dialogue_expires_at?: string;
  resume_prompted?: boolean;

  // ─────────────────────────────
  // TRIN A · RÅ MÅLINGER (AKTIV)
  // ─────────────────────────────
  turn_index?: number;
  user_message_length?: number;
  ai_message_length?: number;

  // ─────────────────────────────
  // TRIN A · TURN-OBSERVATION (AKTIV)
  // Objektive, billige målinger
  // ─────────────────────────────
  turn_observation?: {
    question_count?: number;
    topic_hash?: string;
  };

  // ─────────────────────────────
  // TRIN B · AFLEDTE INDIKATORER (AKTIV, PASSIV)
  // Må IKKE styre flow direkte
  // ─────────────────────────────
  turn_indicators?: {
    progression_state?: "stalled" | "advancing" | "closing"; // future-use
    alignment_state?: "low" | "medium" | "high";             // future-use
    stability_state?: "stable" | "drifting";                 // future-use
    load_estimate?: "low" | "medium" | "high";               // AKTIV
    stop_signal_candidate?: StopSignal;                      // future-use
  };

  // ─────────────────────────────
  // SESSION-LEVEL (AKTIV, PASSIV)
  // Kun opsamling – ingen kontrol
  // ─────────────────────────────
  session_health?: {
    score: number;
    factors: {
      avg_load?: "low" | "medium" | "high";
      high_load_turns?: number;
      turn_count?: number;
    };
  };

  // ───────────────
  // System
  // ───────────────
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
