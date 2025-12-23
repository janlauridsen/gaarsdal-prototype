// lib/playback/runBatchPlayback.ts

import type { BatchPlaybackResult } from "./types";
import { runPlaybackSession } from "./runPlaybackSession";

export async function runBatchPlayback({
  sessions,
  promptId,
  promptText,
  model,
  temperature,
}: {
  sessions: {
    sessionId: string;
    meta: {
      promptVersion: string;
      model: string;
      startedAt: string;
    };
    turns: {
      turnIndex: number;
      userText: string;
      assistantText: string;
    }[];
  }[];
  promptId: string;
  promptText: string;
  model: string;
  temperature: number;
}): Promise<BatchPlaybackResult> {
  const results = [];

  for (const s of sessions) {
    const r = await runPlaybackSession({
      sessionId: s.sessionId,
      originalMeta: s.meta,
      turns: s.turns,
      promptId,
      promptText,
      model,
      temperature,
    });

    results.push(r);
  }

  return {
    batchId: crypto.randomUUID(),
    runAt: new Date().toISOString(),
    sessionCount: results.length,
    sessions: results,
  };
}
