// lib/playback/types.ts

export type PlaybackTurn = {
  turnIndex: number;
  userText: string;
  originalAssistantText: string;
  newAssistantText: string;
};

export type PlaybackSessionResult = {
  sessionId: string;

  original: {
    promptVersion: string;
    model: string;
    startedAt: string;
  };

  playback: {
    promptId: string;
    model: string;
    temperature: number;
    runAt: string;
  };

  turns: PlaybackTurn[];

  stats: {
    originalTurnCount: number;
    newTurnCount: number;
    originalClosedAt?: number;
    newClosedAt?: number;
  };
};

export type BatchPlaybackResult = {
  batchId: string;
  runAt: string;
  sessionCount: number;
  sessions: PlaybackSessionResult[];
};
