export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;

  user_text: string;
  answer: string;

  latency_ms: number;
  status: "ok" | "error";

  evaluator_present: boolean;
  chips_present: boolean;
  chip_clicked: boolean | null;

  // NYT – rå evaluator-output, kun til observability
  evaluator_hints?: string[] | null;
};
