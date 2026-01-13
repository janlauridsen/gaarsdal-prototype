import fs from "fs";
import path from "path";

/*
  MIDLER­TIDIG DEBUG WRITER
  - Skriver rå interpreter-output 1:1
  - Ingen parsing
  - Ingen afhængighed af øvrig logik
*/

const DEBUG_DIR = path.join(
  process.cwd(),
  "chatbot",
  "debug"
);

function ensureDir() {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
}

export async function writeInterpreterRawDebug(
  sessionId: string,
  turnId: number,
  rawText: string
) {
  ensureDir();

  const filePath = path.join(
    DEBUG_DIR,
    `interpreter-raw-${sessionId}.log`
  );

  const entry = [
    "-----",
    `timestamp: ${new Date().toISOString()}`,
    `session_id: ${sessionId}`,
    `turn_id: ${turnId}`,
    "raw:",
    rawText,
    "",
  ].join("\n");

  await fs.promises.appendFile(filePath, entry, "utf8");
}
