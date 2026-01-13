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
 * Bevidst tolerant form-hegn.
 */
export type CQCState = {
  progress?: "good" | "neutral" | "stagnating";
  boundaryControl?: "clear" | "leaky" | "overrestrictive";
  responsiveness?: "sharp" | "adequate" | "slow" | "drifting";
  contextSensitivity?: "high" | "medium" | "low";

  metaNoise?: "low" | "medium" | "high" | "elevated";
  meta_noise?: "low" | "medium" | "high" | "elevated";

  redundancy?: "low" | "medium" | "high";
  closure?: "possible" | "likely" | "confirmed";

  [key: string]: unknown;
};

/**
 * EvaluatorLog
 */
export interface EvaluatorLog {
  stopSignal?: StopSignal;
  cqc?: CQCState;
  notes?: string;
}

/**
 * SessionInterpreterSnapshot
 */
export interface SessionInterpreterSnapshot {
  version: string;
  generatedAt: string;
  sessionHash: string;

  state: {
    phase: "intro" | "main" | "closing" | "unknown";
    dialogCharacter: {
      technicalLevel: "low" | "medium" | "high";
      intentStability: "exploratory" | "focused" | "resolved";
    };
    establishedContext: string[];
    constraints: string[];
  };
}

/**
 * TurnLog
 * ─────────────────────────────
 * Wire-format logstruktur.
 * Matcher faktisk runtime-brug.
 */
export interface TurnLog {
  /* Identitet */
  id?: string;

  sessionId?: string;
  session_id?: string;

  turnId?: number;
  turn_id?: number;

  /* Input / output */
  userInput?: string;
  user_input?: string;

  janRawOutput?: string;
  jan_raw_output?: string;

  finalOutput?: string;
  jan_final_output?: string;

  /* Evaluator */
  evaluator?: EvaluatorLog;
  evaluator_present?: boolean;

  /* Telemetry */
  telemetry?: any;

  /* Timing */
  latencyMs?: number;
  latency_ms?: number;

  createdAt?: string;
  timestamp?: string;

  status?: "ok" | "error";
  error?: string;

  /* Session interpreter (fase-1) */
  sessionInterpreter?: SessionInterpreterSnapshot;

  /* Fremtidssikring */
  [key: string]: unknown;
}
