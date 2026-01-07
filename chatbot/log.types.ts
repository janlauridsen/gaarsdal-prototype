// chatbot/log.types.ts

export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;

  user_text: string;

  // Jan output
  jan_raw?: string;
  jan_final?: string;

  // Bagudkompatibilitet (bruges stadig af UI)
  answer: string;

  // Evaluator / chips observability
  evaluator_present: boolean;
  chips_present: boolean;
  chip_clicked: boolean | null;

  // Performance / status
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
