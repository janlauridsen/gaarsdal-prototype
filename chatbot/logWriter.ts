// chatbot/logWriter.ts
import { TurnLog } from "./log.types";

export function writeTurnLog(entry: TurnLog) {
  console.log(
    JSON.stringify({
      _type: "chatbot_turn",
      ...entry,
    })
  );
}
