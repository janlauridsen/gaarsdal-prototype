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
 * Form-hegn for kvalitative signaler.
 *
 * Bevidst tolerant:
 * - Kendte felter er typede
 * - Ukendte / nye signaler tillades
 *   uden build-brud
 */
export type CQCState = {
  /* Kendte, stabiliserede signaler */
  progress?: "good" | "neutral" | "stagnating";
  boundaryControl?: "clear" | "leaky" | "overrestrictive";
  responsiveness?: "sharp" | "adequate" | "slow" | "drifting";
  contextSensitivity?: "high" | "medium" | "low";

  metaNoise?: "low" | "medium" | "high" | "elevated";
  meta_noise?: "low" | "medium" | "high" | "elevated";

  redundancy?: "low" | "medium" | "high";

  closure?: "possible" | "likely" | "confirmed";

  /* Åbent signalrum for mapper / fremtidige felter */
  [key: string]: unknown;
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

  sessionInterpreter?: SessionInterpreterSnapshot;
}
