/**
 * Permanent reset af ALLE test-relaterede Redis keys
 *
 * Design:
 * - Sletter KUN keys med entydigt test-scope
 * - Ingen TypeScript-syntax
 * - Ingen antagelser om struktur pr. key-type
 * - Sikker mod prod-data
 */

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Justér her hvis test-namespace ændres i fremtiden
const TEST_KEY_PATTERNS = [
  "chatlog:test_*",
  "session:*:test_*",
  "session:test_*",
  "telemetry:test_*",
  "telemetry:*:test_*",
  "replay:test_*",
  "testcases:*",
];

async function resetTestLogs() {
  console.log("Reset test logs: START");

  const keysToDelete = new Set();

  for (const pattern of TEST_KEY_PATTERNS) {
    const keys = await redis.keys(pattern);
    keys.forEach((k) => keysToDelete.add(k));
  }

  if (keysToDelete.size === 0) {
    console.log("Ingen test-keys fundet. Intet slettet.");
    return;
  }

  let deleted = 0;

  for (const key of keysToDelete) {
    await redis.del(key);
    deleted++;
    console.log(`Slettet: ${key}`);
  }

  console.log(`Reset færdig. Slettede ${deleted} test-keys.`);
}

resetTestLogs().catch((err) => {
  console.error("FEJL under reset:", err);
  process.exit(1);
});
