// chatbot/log.types.ts
export type TurnLog = {
  session_id: string;
  turn_id: number;
  timestamp: string;

  user_text: string;

  jan_raw: string;
  evaluator: string;
  jan_final: string;

  status: "ok" | "error";
  error_source?: "ui" | "api" | "model" | "evaluator";
  error_message?: string;

  latency_ms: number;
};
