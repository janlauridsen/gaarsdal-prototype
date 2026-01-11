import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function debug() {
  const keys = await redis.keys("*");
  console.log("REDIS KEYS:");
  console.log(keys);

  if (keys.length === 0) {
    console.log("Ingen keys fundet");
    return;
  }

  const sampleKey = keys[0];
  const sample = await redis.lrange(sampleKey, 0, 1);

  console.log("\nSAMPLE KEY:", sampleKey);
  console.log("SAMPLE ENTRY:");
  console.log(sample);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
