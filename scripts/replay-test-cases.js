// scripts/replay-test-cases.js

import { readFileSync } from "fs";

/* =========
   ENV
   ========= */
const CHATBOT_URL = process.env.CHATBOT_URL;
if (!CHATBOT_URL) {
  throw new Error("CHATBOT_URL er ikke sat");
}

/* =========
   LOAD TEST CASES
   ========= */
const raw = readFileSync("./tests/test-cases.json", "utf8");
const testCases = JSON.parse(raw);

/* =========
   REPLAY
   ========= */
async function replay() {
  console.log("Replay test cases: START");

  for (const testCase of testCases) {
    console.log(`\n▶️  Kører test-case: ${testCase.case_id}`);

    let messages = [];

    for (const turn of testCase.turns) {
      messages.push(turn);

      const res = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: `test_${testCase.case_id}`,
          messages,
        }),
      });

      /* ---------- HARD CONTRACT CHECK ---------- */
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `HTTP ${res.status} fra chat.ts (${testCase.case_id}): ${text}`
        );
      }

      const text = await res.text();
      if (!text) {
        throw new Error(`Tomt svar fra chat.ts (${testCase.case_id})`);
      }

      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Ugyldigt JSON-svar fra chat.ts (${testCase.case_id}): ${text}`
        );
      }

      if (!json.answer) {
        throw new Error(
          `Manglende 'answer' i svar (${testCase.case_id})`
        );
      }

      /* ---------- FEED BACK INTO DIALOG ---------- */
      messages.push({
        role: "assistant",
        content: json.answer,
      });
    }

    console.log(`✅  Færdig: ${testCase.case_id}`);
  }

  console.log("\nReplay test cases: FÆRDIG");
}

/* =========
   RUN
   ========= */
replay().catch((err) => {
  console.error("FEJL under replay:", err.message);
  process.exit(1);
});
