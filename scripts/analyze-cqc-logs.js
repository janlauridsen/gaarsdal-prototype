import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function analyze() {
  // Hent alle chatlogs
  const keys = await redis.keys("chatlog:*");

  const report = [];

  for (const key of keys) {
    const entries = await redis.lrange(key, 0, -1);
    if (!entries || entries.length === 0) continue;

    const parsed = entries.map(e => {
      try {
        return typeof e === "string" ? JSON.parse(e) : e;
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (parsed.length === 0) continue;

    const turnCount = parsed.length;

    const loadSequence = parsed.map(e =>
      e?.telemetry?.turn_indicators?.load_estimate ?? null
    );

    const chips = parsed.flatMap(e => {
      try {
        const txt = e?.telemetry?.evaluator_text;
        if (!txt) return [];
        const obj = typeof txt === "string" ? JSON.parse(txt) : txt;
        return obj?.chips ?? [];
      } catch {
        return [];
      }
    });

    const repeatedChips =
      chips.length > 0 &&
      new Set(chips).size < chips.length;

    // === CQC SIGNALER ===

    let progress = "insufficient_data";
    if (turnCount >= 3) {
      progress = "stalled";
    }

    let contextSensitivity = "appropriate";
    if (turnCount >= 3) {
      contextSensitivity = "overextended";
    }

    const boundary = "stable";

    report.push({
      session_id: key.replace("chatlog:", ""),
      signals: {
        progress,
        boundary,
        context_sensitivity: contextSensitivity,
      },
      evidence: {
        turn_count: turnCount,
        load_sequence: loadSequence,
        repeated_chips: repeatedChips,
      },
    });
  }

  const output = {
    generated_at: new Date().toISOString(),
    cases_analyzed: report.length,
    report,
  };

  // 🔴 VIGTIGT:
  // KUN JSON på stdout
  process.stdout.write(JSON.stringify(output, null, 2));
}

// Kør analyse
analyze().catch(err => {
  // Fejl må IKKE forurene stdout
  console.error("A4 analyse FEJL:", err.message);
  process.exit(1);
});
