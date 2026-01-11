import { Redis } from "@upstash/redis";
import fs from "fs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OUTPUT_DIR = "exports";
const OUTPUT_FILE = `${OUTPUT_DIR}/session-logs.jsonl`;

/**
 * Bestem kilde uden heuristik.
 * Brug kun allerede eksisterende signaler i log-entry.
 */
function detectSource(entry) {
  if (entry?.meta?.replay === true) return "replay";
  if (entry?.meta?.test_case_id) return "test";
  return "live";
}

async function exportLogs() {
  console.log("Starter log-eksport fra Redis");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  // Forventet key-format: chatlog:<sessionId>
  const keys = await redis.keys("chatlog:*");

  console.log(`Fundet sessions: ${keys.length}`);

  for (const key of keys) {
    const sessionId = key.replace("chatlog:", "");

    let entries;
    try {
      entries = await redis.lrange(key, 0, -1);
    } catch (err) {
      console.warn(`Kunne ikke læse session ${sessionId}: ${err.message}`);
      continue;
    }

    if (!Array.isArray(entries) || entries.length === 0) continue;

    entries.forEach((raw, index) => {
      let entry;
      try {
        entry = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        console.warn(`Kunne ikke parse log-entry i session ${sessionId}`);
        return;
      }

      const line = {
        session_id: sessionId,
        turn_index: index,
        role: entry.role ?? null,
        content: entry.content ?? null,
        timestamp: entry.timestamp ?? null,
        source: detectSource(entry),
      };

      stream.write(JSON.stringify(line) + "\n");
    });
  }

  stream.end();
  console.log(`Eksport færdig: ${OUTPUT_FILE}`);
}

exportLogs().catch((err) => {
  console.error("Export FEJL:", err);
  process.exit(1);
});
