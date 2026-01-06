// chatbot/log.types.ts

export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;

  user_text: string;
  answer: string;

  latency_ms: number;
  status: "ok" | "error";
  error?: string;

  // === Observability (NYE FELTER) ===
  evaluator_present: boolean;
  chips_present: boolean;
  chip_clicked: boolean | null;
};
