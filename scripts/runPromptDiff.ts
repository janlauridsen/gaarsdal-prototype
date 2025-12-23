#!/usr/bin/env ts-node

import { runPromptDiff } from "../lib/eval/runPromptDiff";
import fs from "fs";
import path from "path";

/**
 * Eksempel:
 * ts-node scripts/runPromptDiff.ts \
 *   --sessions sessions.json \
 *   --base screening-v4.4 \
 *   --compare screening-v4.5
 */

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

async function main() {
  const sessionsFile = getArg("sessions");
  const basePrompt = getArg("base");
  const comparePrompt = getArg("compare");

  if (!sessionsFile || !basePrompt || !comparePrompt) {
    console.error(`
Usage:
  ts-node scripts/runPromptDiff.ts \\
    --sessions sessions.json \\
    --base screening-v4.4 \\
    --compare screening-v4.5
`);
    process.exit(1);
  }

  const sessionIds: string[] = JSON.parse(
    fs.readFileSync(path.resolve(sessionsFile), "utf8")
  );

  console.log("▶ Prompt diff batch");
  console.log("Sessions:", sessionIds.length);
  console.log("Base:", basePrompt);
  console.log("Compare:", comparePrompt);
  console.log("—");

  const result = await runPromptDiff({
    sessionIds,
    base: {
      promptVersion: basePrompt,
      model: "gpt-4o-mini",
    },
    compare: {
      promptVersion: comparePrompt,
      model: "gpt-4o-mini",
    },
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
