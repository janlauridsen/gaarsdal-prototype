// chatbot/log.types.ts

export type ExecutionContext = "live" | "replay" | "test";

export type StopSignal =
  | "afklaring_opnået"
  | "bruger_lukker_dialog"
  | "overgang_til_handling"
  | null;

export type TurnLog = {
  /* ───────── Core ───────── */

  /**
   * Hvornår log-entry er skabt
   * ISO timestamp
   */
  timestamp: string;

  /**
   * Hvordan dette turn blev eksekveret
   * live = rigtig bruger
   * replay = afspilning
   * test = manuel / CI
   */
  execution_context?: ExecutionContext;

  session_id: string;
  turn_id: number;

  /* ───────── Versionering ───────── */

  /**
   * Kodeversion (git tag el. commit)
   */
  code_version?: string;

  /**
   * Prompt-versioner
   */
  prompt_version?: string;
  evaluator_version?: string;
  reshape_version?: string;

  /* ───────── Indhold ───────── */

  user_text: string;

  jan_raw: string;
  jan_final: string;
  answer: string;

  evaluator_text: string | null;
  evaluator_present: boolean;

  chips_present: boolean;
  chip_clicked: string | null;

  /* ─────────────────────────────
     TRIN 1 · OBSERVABILITY
     (ingen styring, kun måling)
     ───────────────────────────── */

  last_user_at?: string;
  session_age_ms?: number;
  dialogue_expires_at?: string;

  /**
   * Om brugeren er blevet tilbudt
   * genoptag / start ny
   */
  resume_prompted?: boolean;

  /**
   * Brugerens valg, hvis relevant
   */
  resume_choice?: "resume" | "new" | null;

  /**
   * Stop-signal observeret i dette turn
   */
  stop_signal?: StopSignal;

  /**
   * Om stop-signal blev anvendt
   */
  stop_applied?: boolean;

  /* ───────── UX-telemetri ───────── */

  user_message_length?: number;
  ai_message_length?: number;

  time_since_last_turn_ms?: number;
  turn_count_total?: number;

  /* ───────── Drift ───────── */

  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
