// lib/playback/runPlaybackSession.ts

import { buildPlaybackMessages } from "./buildMessages";
import type { PlaybackSessionResult } from "./types";

export async function runPlaybackSession({
  sessionId,
  originalMeta,
  turns,
  promptId,
  promptText,
  model,
  temperature,
}: {
  sessionId: string;
  originalMeta: {
    promptVersion: string;
    model: string;
    startedAt: string;
  };
  turns: {
    turnIndex: number;
    userText: string;
    assistantText: string;
  }[];
  promptId: string;
  promptText: string;
  model: string;
  temperature: number;
}): Promise<PlaybackSessionResult> {
  const userTurns = turns.map((t) => ({ userText: t.userText }));

  const messages = buildPlaybackMessages(promptText, userTurns);

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI error ${resp.status}`);
  }

  const data = await resp.json();
  const newAssistantText =
    data?.choices?.[0]?.message?.content ?? "";

  return {
    sessionId,

    original: originalMeta,

    playback: {
      promptId,
      model,
      temperature,
      runAt: new Date().toISOString(),
    },

    turns: turns.map((t) => ({
      turnIndex: t.turnIndex,
      userText: t.userText,
      originalAssistantText: t.assistantText,
      newAssistantText,
    })),

    stats: {
      originalTurnCount: turns.length,
      newTurnCount: turns.length,
    },
  };
}
