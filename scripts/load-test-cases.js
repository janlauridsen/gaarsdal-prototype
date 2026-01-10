import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const TEST_CASES_PATH = path.join(
  process.cwd(),
  "tests/test-cases.json"
);

const REDIS_KEY = "testcases:v1";

async function loadTestCases() {
  console.log("Load test cases: START");

  const raw = fs.readFileSync(TEST_CASES_PATH, "utf8");
  const cases = JSON.parse(raw);

  if (!Array.isArray(cases)) {
    throw new Error("Test-cases skal være et array");
  }

  await redis.set(REDIS_KEY, cases);

  console.log(
    `Load færdig. Indlæste ${cases.length} test-cases til ${REDIS_KEY}`
  );
}

loadTestCases().catch((err) => {
  console.error("FEJL under load:", err);
  process.exit(1);
});
