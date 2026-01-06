export type TurnLog = {
  timestamp: string;
  session_id: string;
  turn_id: number;
  user_text: string;
  answer: string;
  latency_ms: number;
  status: "ok" | "error";
  error?: string;
};
