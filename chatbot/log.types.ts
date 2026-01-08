// chatbot/log.types.ts

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
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

  // ─────────────────────────────
  // TRIN 1 · OBSERVABILITY
  // (ingen styring, kun måling)
  // ─────────────────────────────

  /**
   * Hvornår brugeren sidst skrev noget
   * ISO timestamp
   */
  last_user_at?: string;

  /**
   * Hvor gammel sessionen er ved dette turn
   * i millisekunder
   */
  session_age_ms?: number;

  /**
   * Hvornår dialogen betragtes som udløbet
   * ISO timestamp
   */
  dialogue_expires_at?: string;

  /**
   * Om brugeren på noget tidspunkt
   * er blevet præsenteret for et
   * "genoptag / start ny"-valg
   */
  resume_prompted?: boolean;

  /**
   * Stop-signal observeret i dette turn
   * (fra evaluator / reshape)
   */
  stop_signal?: StopSignal;

  /**
   * Om et stop-signal faktisk blev
   * anvendt i flowet
   */
  stop_applied?: boolean;

  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
