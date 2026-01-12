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
 * Normativ kvalitetsvurdering pr. turn.
 */
export type CQCState = {
  progress?: "good" | "neutral" | "stagnating";
  boundaryControl?: "clear" | "leaky" | "overrestrictive";
  responsiveness?: "sharp" | "adequate" | "slow";
  contextSensitivity?: "high" | "medium" | "low";
  metaNoise?: "low" | "medium" | "high";
};

/**
 * EvaluatorLog
 * ─────────────────────────────
 * Snævert metasignal baseret udelukkende på JAN RAW output.
 */
export interface EvaluatorLog {
  stopSignal?: StopSignal;
  cqc?: CQCState;
  notes?: string;
}

/**
 * SessionInterpreterSnapshot
 * ─────────────────────────────
 * Asynkront, session-bundet fortolkningssignal.
 * Produceres uden kendskab til aktuelt brugerinput.
 * Må ikke være normativt eller handlingsanvisende.
 */
export interface SessionInterpreterSnapshot {
  version: string; // kontrakt-version
  generatedAt: string; // ISO timestamp
  sessionHash: string; // hash af historikgrundlag

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
 * Primær sandhedsenhed for replay og CQC.
 */
export interface TurnLog {
  id: string;
  sessionId: string;

  userInput: string;

  janRawOutput: string;
  finalOutput: string;

  evaluator?: EvaluatorLog;

  latencyMs: number;
  createdAt: string;

  /**
   * Session-niveau fortolkningssignal,
   * som var gældende for denne turn.
   * Valgfrit og ikke turn-blokerende.
   */
  sessionInterpreter?: SessionInterpreterSnapshot;
}
