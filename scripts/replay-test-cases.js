/**
 * Replay test cases mod live /api/chat
 * JS-only. Ingen TS-syntaks.
 *
 * Designmål:
 * - Tolerant replay
 * - Stopper aldrig på hængende requests
 * - Ingen afhængighed af Redis cleanup
 * - Hvert run er isoleret via run_id
 */

import { readFileSync } from "fs";
import crypto from "crypto";

let CHATBOT_URL = process.env.CHATBOT_URL;
if (!CHATBOT_URL) {
  throw new Error("CHATBOT_URL er ikke sat");
}

if (!CHATBOT_URL.endsWith("/api/chat")) {
  CHATBOT_URL = CHATBOT_URL.replace(/\/$/, "") + "/api/chat";
}

const TEST_CASES_PATH = "./tests/test-cases.json";
const REQUEST_TIMEOUT_MS = 20_000;
const TURN_DELAY_MS = 300;

// Unik run-id → permanent Redis-sikkerhed
const RUN_ID = crypto.randomUUID();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFireAndForget(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

async function replay() {
  console.log("Replay test cases: START");
  console.log("API endpoint:", CHATBOT_URL);
  console.log("RUN_ID:", RUN_ID);

  const raw = readFileSync(TEST_CASES_PATH, "utf8");
  const testCases = JSON.parse(raw);

  let totalCases = 0;
  let casesWithAnySuccess = 0;

  for (const testCase of testCases) {
    totalCases++;
    const { case_id, turns } = testCase;

    console.log(`\n▶️  Kører test-case: ${case_id}`);

    // Session-id er nu entydig pr. run
    const sessionId = `replay:${RUN_ID}:${case_id}`;
    let hadAnySuccess = false;

    for (let i = 0; i < turns.length; i++) {
      try {
        const res = await fetchFireAndForget(
          CHATBOT_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              messages: turns.slice(0, i + 1),
            }),
          },
          REQUEST_TIMEOUT_MS
        );

        if (!res.ok) {
          console.warn(
            `⚠️  HTTP ${res.status} (${case_id}, turn ${i + 1})`
          );
          continue;
        }

        hadAnySuccess = true;
        await sleep(TURN_DELAY_MS);

      } catch (err) {
        if (err && err.name === "AbortError") {
          console.warn(
            `⏱ Timeout (${case_id}, turn ${i + 1}) efter ${REQUEST_TIMEOUT_MS}ms`
          );
        } else {
          console.warn(
            `⚠️  Netværksfejl (${case_id}, turn ${i + 1}): ${String(err)}`
          );
        }
      }
    }

    if (hadAnySuccess) {
      casesWithAnySuccess++;
      console.log(`✅ Test-case gennemført (delvist eller fuldt): ${case_id}`);
    } else {
      console.warn(`❌ Ingen succesfulde turns: ${case_id}`);
    }
  }

  console.log("\nReplay færdig.");
  console.log(`Cases kørt: ${totalCases}`);
  console.log(`Cases med mindst én succes: ${casesWithAnySuccess}`);

  if (casesWithAnySuccess === 0) {
    console.error("Replay FEJLEDE: ingen test-cases ramte systemet");
    process.exit(1);
  }

  console.log("Replay OK (tolerant mode)");
  process.exit(0);
}

replay().catch((err) => {
  console.error("Uventet replay-fejl:", err);
  process.exit(1);
});
