import { Redis } from "@upstash/redis";
import fs from "fs";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const OUTPUT_FILE = "exports/session-logs.jsonl";

function detectSource(entry) {
  // Brug kun eksisterende signaler
  // Justér disse checks efter faktiske felter i log.types.ts
  if (entry?.meta?.replay === true) return "replay";
  if (entry?.meta?.test_case_id) return "test";
  return "live";
}

async function exportLogs() {
  const keys = await redis.keys("chatlog:*");
  fs.mkdirSync("exports", { recursive: true });

  const stream = fs.createWriteStream(OUTPUT_FILE, { flags: "w" });

  for (const key of keys) {
    const sessionId = key.replace("chatlog:", "");
    const entries = await redis.lrange(key, 0, -1);
    if (!entries || entries.length === 0) continue;

    entries.forEach((raw, index) => {
      const entry = typeof raw === "string" ? JSON.parse(raw) : raw;

      const line = {
        session_id: sessionId,
        turn_index: index,
        role: entry.role,
        content: entry.content,
        timestamp: entry.timestamp,
        source: detectSource(entry),
      };

      stream.write(JSON.stringify(line) + "\n");
    });
  }

  stream.end();
  console.log(`Eksport færdig: ${OUTPUT_FILE}`);
}

exportLogs().catch(err => {
  console.error("Export FEJL:", err.message);
  process.exit(1);
});
