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
 *
 * VIGTIGT:
 * Denne type er eksplicit tolerant over for
 * mapper-output for at undgå gentagne build-brud.
 */
export type CQCState = {
  // Fremdrift i samtalen
  progress?: "good" | "neutral" | "stagnating";

  // Afgrænsning
  boundaryControl?: "clear" | "leaky" | "overrestrictive";

  // Responsivitet (inkl. drift)
  responsiveness?: "sharp" | "adequate" | "slow" | "drifting";

  // Kontekstforståelse
  contextSensitivity?: "high" | "medium" | "low";

  // Meta-støj (camelCase)
  metaNoise?: "low" | "medium" | "high" | "elevated";

  // Meta-støj (snake_case – legacy / mapper)
  meta_noise?: "low" | "medium" | "high" | "elevated";

  // Redundans / gentagelser
  redundancy?: "low" | "medium" | "high";
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

  /**
   * Session-niveau fortolkningssignal,
   * som var gældende for denne turn.
   * Valgfrit og ikke turn-blokerende.
   */
  sessionInterpreter?: SessionInterpreterSnapshot;
}
