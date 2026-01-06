export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;
  user_text: string;
  answer: string;

  evaluator_present: boolean;
  chips_present: boolean;
  chip_clicked: boolean | null;

  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
