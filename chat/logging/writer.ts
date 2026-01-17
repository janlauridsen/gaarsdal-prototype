/**
 * LOG WRITER
 * Ingen buffering. Ingen intelligens.
 * Én funktion = ét append.
 */

import { LogEntry } from "./types";

export type LogWriter = (entry: LogEntry) => void;

/**
 * Default writer.
 * I produktion kan denne erstattes af DB / queue.
 */
export const consoleLogWriter: LogWriter = (entry) => {
  // Midlertidig reference-implementation
  console.log("[CHAT-LOG]", JSON.stringify(entry, null, 2));
};
