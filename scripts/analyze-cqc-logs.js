/**
 * A4 – CQC analyse (regelbaseret, ikke-AI)
 *
 * Output:
 * - Ét analyse-objekt pr. test-case/session
 * - Kun signaler og evidens
 */

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const TEST_SESSION_PREFIX = "test_";

function classifyProgress(turns) {
  if (turns.length < 3) return "insufficient_data";

  let unchanged = 0;
  for (let i = 1; i < turns.length; i++) {
    const prev = turns[i - 1];
    const curr = turns[i];

    if (
      prev.turn_indicators?.load_estimate ===
        curr.turn_indicators?.load_estimate &&
      JSON.stringify(prev.telemetry?.chips || []) ===
        JSON.stringify(curr.telemetry?.chips || [])
    ) {
      unchanged++;
    }
  }

  if (unchanged >= 2) return "stalled";
  return "advancing";
}

function classifyBoundary(turns) {
  const chipCounts = {};
  for (const t of turns) {
    const chips = t.telemetry?.chips || [];
    for (const c of chips) {
      chipCounts[c] = (chipCounts[c] || 0) + 1;
    }
  }

  const repeated = Object.values(chipCounts).some((n) => n >= 2);
  return repeated ? "repeated" : "stable";
}

function classifyContextSensitivity(turns) {
  const last = turns.at(-1);
  if (!last) return "unknown";

  const userLen = last.telemetry?.user_message_length ?? 0;
  const aiLen = last.telemetry?.ai_message_length ?? 0;
  const questionCount = last.turn_observation?.question_count ?? 0;

  if (userLen <= 6 && (questionCount > 0 || aiLen > 200)) {
    return "overextended";
  }

  return "appropriate";
}

async function analyze() {
  console.log("A4 analyse: START");

  const keys = await redis.keys("chatlog:*");
  const testKeys = keys.filter((k) =>
    k.includes(TEST_SESSION_PREFIX)
  );

  const sessions = {};

  for (const key of testKeys) {
    const logs = await redis.lrange(key, 0, -1);
    for (const raw of logs) {
      const entry = JSON.parse(raw);
      const sid = entry.session_id;

      if (!sessions[sid]) sessions[sid] = [];
      sessions[sid].push(entry);
    }
  }

  const report = [];

  for (const [sessionId, turns] of Object.entries(sessions)) {
    turns.sort((a, b) => a.turn_id - b.turn_id);

    const progress = classifyProgress(turns);
    const boundary = classifyBoundary(turns);
    const context = classifyContextSensitivity(turns);

    report.push({
      session_id: sessionId,
      signals: {
        progress,
        boundary,
        context_sensitivity: context,
      },
      evidence: {
        turn_count: turns.length,
        avg_load: turns.map(
          (t) => t.turn_indicators?.load_estimate
        ),
        repeated_chips:
          boundary === "repeated",
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        cases_analyzed: report.length,
        report,
      },
      null,
      2
    )
  );

  console.log("A4 analyse: FÆRDIG");
}

analyze().catch((err) => {
  console.error("A4 analyse FEJL:", err);
  process.exit(1);
});
