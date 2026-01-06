// chatbot/log.types.ts

export type TurnStatus = "ok" | "error";

export interface TurnLog {
  timestamp: string;      // ISO timestamp
  session_id: string;     // UI session id
  turn_id: number;        // løbende pr. session
  user_text: string;      // sidste brugerinput
  answer: string;         // model-output
  latency_ms: number;     // ms
  status: TurnStatus;     // ok | error
  error?: string;         // kun ved error
}
