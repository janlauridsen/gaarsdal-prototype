import { TurnLog } from "./log.types";

/*
  Udvidet log entry.
  TurnLog er uændret.
*/
export type AiCallLogEntry = {
  timestamp: string;
  session_id: string;
  turn_id: number;
  call_id: string;
  model: string;
  temperature: number;
  request_messages: any[];
  response_raw: any;
  response_text: string;
  latency_ms: number;
};

/*
  Samlet log payload.
  TurnLog er primary.
  ai_calls er optional.
*/
export type ExtendedTurnLog = TurnLog & {
  ai_calls?: AiCallLogEntry[];
};

/*
  ÉN writer.
  Cloud-safe.
*/
export async function writeTurnLog(
  entry: ExtendedTurnLog
): Promise<void> {
  /*
    BEVIDST:
    - Ingen fs
    - Ingen antagelser
    - Brug din eksisterende persistens her
  */

  // EKSEMPEL (pseudo – behold din egen implementation):
  // await db.insert("turn_logs", entry);

  console.log(
    "[TURN LOG]",
    JSON.stringify(entry, null, 2)
  );
}
