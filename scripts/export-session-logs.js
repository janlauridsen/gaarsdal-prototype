import { Redis } from "@upstash/redis";
import fs from "fs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OUTPUT_DIR = "exports";
const OUTPUT_FILE = `${OUTPUT_DIR}/conversation-logs.jsonl`;

/**
 * Bestem kilde uden heuristik.
 */
function detectSource(entry) {
  if (entry?.meta?.replay === true) return "replay";
  if (entry?.meta?.test_case_id) return "test";
  return "live";
}

/**
 * Udtræk faktisk samtaletekst.
 * Ingen rekonstruktion, kun eksisterende felter.
 */
function extractText(entry) {
  if (typeof entry?.content === "string") return entry.content;

  if (Array.isArray(entry?.messages)) {
    const last = entry.messages[entry.messages.length - 1];
    if (typeof last?.content === "string") return last.content;
  }

  return null;
}

function extractSpeaker(entry) {
  return entry?.role ?? entry?.speaker ?? "unknown";
}

async function exportLogs() {
  console.log("Starter samtale-eksport fra Redis");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  const keys = await redis.keys("chatlog:*");
  console.log(`Fundet sessions: ${keys.length}`);

  for (const key of keys) {
    const sessionId = key.replace("chatlog:", "");
    const entries = await redis.lrange(key, 0, -1);
    if (!Array.isArray(entries) || entries.length === 0) continue;

    entries.forEach((raw, index) => {
      let entry;
      try {
        entry = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        return;
      }

      const text = extractText(entry);
      if (!text) return;

      const line = {
        session_id: sessionId,
        turn_index: index,
        speaker: extractSpeaker(entry),
        text,
        timestamp: entry.timestamp ?? null,
        source: detectSource(entry),
        meta: entry.meta ?? null,
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
