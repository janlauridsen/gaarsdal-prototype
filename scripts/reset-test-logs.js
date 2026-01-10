import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

async function resetTestLogs() {
  console.log("Reset test logs: START");

  const keys = await redis.keys("turnlog:test_*");

  if (!keys || keys.length === 0) {
    console.log("Ingen test-logs fundet. Intet slettet.");
    return;
  }

  for (const key of keys) {
    await redis.del(key);
    console.log(`Slettet: ${key}`);
  }

  console.log(`Reset færdig. Slettede ${keys.length} test-logs.`);
}

resetTestLogs().catch((err) => {
  console.error("FEJL under reset:", err);
  process.exit(1);
});
