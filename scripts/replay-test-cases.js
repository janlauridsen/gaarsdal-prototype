/**
 * Replay test cases mod live chat.ts
 * A3-version: tolerant replay
 *
 * Kontrakt:
 * - Logger fejl pr. test-case
 * - Stopper IKKE på HTTP-fejl
 * - Stopper ALDRIG på streaming/hæng
 * - Læser IKKE response body
 * - Exit 1 kun hvis INGEN cases rammer systemet
 */

import { readFileSync } from "fs";

let CHATBOT_URL = process.env.CHATBOT_URL;
if (!CHATBOT_URL) {
  throw new Error("CHATBOT_URL er ikke sat");
}

// Kræv /api/chat
if (!CHATBOT_URL.endsWith("/api/chat")) {
  CHATBOT_URL = CHATBOT_URL.replace(/\/$/, "") + "/api/chat";
}

const TEST_CASES_PATH = "./tests/test-cases.json";
const REQUEST_TIMEOUT_MS = 20_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchFireAndForget(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Vi læser INTET fra body
    return res;
  } finally {
    clearTimeout(id);
    controller.abort(); // luk forbindelsen eksplicit
  }
}

async function replay() {
  console.log("Replay test cases: START");
  console.log("API endpoint:", CHATBOT_URL);

  const raw = readFileSync(TEST_CASES_PATH, "utf8");
  const testCases = JSON.parse(raw);

  let totalCases = 0;
  let casesWithAnySuccess = 0;

  for (const testCase of testCases) {
    totalCases++;
    const { case_id, turns } = testCase;

    console.log(`\n▶️  Kører test-case: ${case_id}`);

    const sessionId = `test_${case_id}`;
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
        await sleep(300);

      } catch (err) {
        if (err.name === "AbortError") {
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
