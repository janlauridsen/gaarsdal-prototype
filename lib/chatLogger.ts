// lib/chatLogger.ts

import fs from "fs";
import path from "path";
import crypto from "crypto";

const LOG_DIR = path.join(process.cwd(), "logs");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export type ChatTurnLog = {
  sessionId: string;
  turnIndex: number;
  timestamp: string;
  mode: string;
  userInput: string;
  assistantOutput: string;
};

export function getSessionId(req: any): string {
  return (
    req.headers["x-session-id"] ??
    crypto.randomUUID()
  );
}

export function logChatTurn(entry: ChatTurnLog) {
  ensureLogDir();

  const filePath = path.join(
    LOG_DIR,
    `${entry.sessionId}.jsonl`
  );

  fs.appendFileSync(
    filePath,
    JSON.stringify(entry) + "\n",
    "utf8"
  );
}
