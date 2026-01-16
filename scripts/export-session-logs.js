import { Redis } from "@upstash/redis";
import fs from "fs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OUTPUT_DIR = "exports";
const OUTPUT_FILE = `${OUTPUT_DIR}/raw-session-logs.jsonl`;

async function exportLogs() {
  console.log("Starter RAW log-eksport fra Redis");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  const keys = await redis.keys("chatlog:*");
  console.log(`Fundet chatlog sessions: ${keys.length}`);

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

      const line = {
        session_id: sessionId,
        turn_index: index,
        entry, // HELE rå objektet
      };

      stream.write(JSON.stringify(line) + "\n");
    });
  }

  stream.end();
  console.log(`RAW eksport færdig: ${OUTPUT_FILE}`);
}

exportLogs().catch((err) => {
  console.error("Export FEJL:", err);
  process.exit(1);
});
