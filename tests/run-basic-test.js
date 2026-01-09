import fs from "fs";
import { Redis } from "@upstash/redis";

const scenario = JSON.parse(
  fs.readFileSync("test-scenarios/basic.json", "utf8")
);

const redis = Redis.fromEnv();

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  let messages = [];

  for (const turn of scenario.turns) {
    messages.push({ role: "user", content: turn });

    const res = await fetch(process.env.CHATBOT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: scenario.session_id,
        messages
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
  }

  // Vent på Redis writes
  await sleep(1500);

  // TILPAS HVIS KEY-FORMAT ER ANDERLEDES
  const key = `turnlog:${scenario.session_id}`;
  const logs = await redis.lrange(key, -1, -1);

  if (!logs || logs.length === 0) {
    throw new Error("Ingen logs fundet");
  }

  const last = JSON.parse(logs[0]);
  const avgLoad = last?.session?.health?.factors?.avg_load;

  if (avgLoad === "high") {
    throw new Error("avg_load blev high");
  }

  console.log("PASS: avg_load =", avgLoad);
}

run().catch(err => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
