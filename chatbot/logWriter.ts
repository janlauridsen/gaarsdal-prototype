// chatbot/logWriter.ts
import fs from "fs";
import path from "path";
import { TurnLog } from "./log.types";

const LOG_PATH = path.join(process.cwd(), "logs", "chatbot-turns.ndjson");

export function writeTurnLog(entry: TurnLog) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
}
