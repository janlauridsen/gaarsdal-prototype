// chatbot/log.types.ts

export type TurnLogStatus = "ok" | "error";

export type TurnLog = {
  timestamp: string;              // ISO
  session_id: string;             // client session id
  turn_id: number;                // stigende pr session

  user_text: string;              // sidste user input
  answer: string;                 // endeligt svar vist for bruger

  latency_ms: number;
  status: TurnLogStatus;

  // ── Observability (NYT, PASSIVT) ──
  evaluator_present: boolean;     // evaluator kørte i denne tur
  chips_present: boolean;         // chips blev vist
  chip_clicked: boolean | null;   // null=ingen chips, false=ignoreret, true=brugt

  // valgfrit ved fejl
  error?: string;
};
