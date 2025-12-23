import { redisSet, redisAppend } from "./redis";

export type ChatState =
  | "welcome"
  | "orienting"
  | "screening"
  | "closed";

export type SessionMeta = {
  sessionId: string;
  startedAt: string;
  endedAt?: string;

  model: string;
  promptVersion: string;
  environment: "dev" | "prod";

  closedReason?: "concluded" | "aborted" | "error";
};

export type SessionTurn = {
  sessionId: string;
  turnIndex: number;

  userText: string;
  assistantText: string;

  chatStateBefore: ChatState;
  chatStateAfter: ChatState;

  isClosing: boolean;
  timestamp: string;
};

/**
 * Opretter (eller overskriver) session-metadata.
 * Kaldes én gang ved session-start.
 */
export async function logSessionMeta(meta: SessionMeta) {
  const key = `session:${meta.sessionId}:meta`;
  await redisSet(key, meta);
}

/**
 * Append-only log af et enkelt turn.
 * Rækkefølgen er kronologisk (RPUSH).
 */
export async function logSessionTurn(turn: SessionTurn) {
  const key = `session:${turn.sessionId}:turns`;
  await redisAppend(key, turn);
}

/**
 * Marker session som afsluttet.
 * Meta opdateres, turns ændres ikke.
 */
export async function finalizeSession(
  sessionId: string,
  closedReason: SessionMeta["closedReason"]
) {
  const key = `session:${sessionId}:meta`;

  // Hent eksisterende meta
  const res = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    }
  );

  let existing = {};
  try {
    const text = await res.text();
    existing = text ? JSON.parse(text) : {};
  } catch {
    existing = {};
  }

  const merged = {
    ...existing,
    endedAt: new Date().toISOString(),
    closedReason,
  };

  await redisSet(key, merged);
}
