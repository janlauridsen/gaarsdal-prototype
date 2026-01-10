import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const CHAT_URL = process.env.CHATBOT_URL;
const TEST_CASES_KEY = "testcases:v1";

if (!CHAT_URL) {
  throw new Error("CHATBOT_URL er ikke sat");
}

async function replay() {
  console.log("Replay test cases: START");

  const cases = await redis.get(TEST_CASES_KEY);

  if (!Array.isArray(cases)) {
    throw new Error("Ingen test-cases fundet i Redis");
  }

  for (const testCase of cases) {
    const sessionId = `test_${testCase.case_id}`;
    console.log(`\n▶️  Kører test-case: ${testCase.case_id}`);

    let messages = [];

    for (const turn of testCase.turns) {
      messages.push({
        role: "user",
        content: turn.content,
      });

      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          messages,
        }),
      });

      const json = await res.json();

      if (!json.answer) {
        throw new Error(
          `Ingen answer for ${testCase.case_id}`
        );
      }

      messages.push({
        role: "assistant",
        content: json.answer,
      });
    }
  }

  console.log("\nReplay færdig.");
}

replay().catch((err) => {
  console.error("FEJL under replay:", err);
  process.exit(1);
});
