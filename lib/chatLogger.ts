// lib/chatLogger.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";

const LOG_DIR = path.join(process.cwd(), "logs");

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export type ChatLogEntry = {
  sessionId: string;
  turnIndex: number;
  timestamp: string;
  mode: string;
  userInput: string;
  assistantOutput: string;
};

export function resolveSessionId(req: any): string {
  return (
    req.headers["x-session-id"] ||
    crypto.randomUUID()
  );
}

export function logTurn(entry: ChatLogEntry) {
  ensureDir();

  const file = path.join(LOG_DIR, `${entry.sessionId}.jsonl`);

  fs.appendFileSync(
    file,
    JSON.stringify(entry) + "\n",
    "utf8"
  );
}
