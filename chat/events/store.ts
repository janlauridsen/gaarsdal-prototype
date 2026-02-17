// chat/events/store.ts
// Canonical events list keys:
//   gaarsdal:events:v1:${conversationId}
// Observed legacy/bug keys (double "c:" etc.):
//   gaarsdal:events:v1:c:${conversationId}

export type RedisLike = {
  rpush: (...args: any[]) => Promise<any>;
  ltrim: (...args: any[]) => Promise<any>;
  lrange: (...args: any[]) => Promise<any>;
  llen?: (...args: any[]) => Promise<any>;
};

export const EVENTS_SCHEMA_VERSION = "v1" as const;

const KEY_EVENTS_PREFIX_CANONICAL = "gaarsdal:events:v1:"; // + {conversation_id} OR "all" OR "u:{userKey}" etc.
const KEY_EVENTS_PREFIX_LEGACY_BUG = "gaarsdal:events:v1:c:"; // + {conversation_id}

// Lists
const KEY_EVENTS_ALL = `${KEY_EVENTS_PREFIX_CANONICAL}all`;
const KEY_EVENTS_USER = (userKey: string) => `${KEY_EVENTS_PREFIX_CANONICAL}u:${userKey}`;
const KEY_EVENTS_CONVO = (conversationId: string) => `${KEY_EVENTS_PREFIX_CANONICAL}${conversationId}`;
const KEY_EVENTS_CONVO_LEGACY_BUG = (conversationId: string) =>
  `${KEY_EVENTS_PREFIX_LEGACY_BUG}${conversationId}`;

// Keep last N events (same as logs: -4000 -1)
const DEFAULT_MAX_EVENTS = 4000;

// If you *must* keep dual-write temporarily, set to true.
// NOTE: true will recreate duplication you see in logs.
const DUAL_WRITE_LEGACY_BUG_KEY = false;

export type EventEnvelope<TPayload = any> = {
  schema_version: typeof EVENTS_SCHEMA_VERSION;
  event_id: string;
  event_type: string;
  conversation_id: string;
  user_key: string;
  revision: number;
  input_id?: number;
  node_id?: string;
  timestamp_ms: number;
  payload: TPayload;
};

export type AppendEventOptions = {
  maxEvents?: number;
  writeAll?: boolean; // gaarsdal:events:v1:all
  writeUser?: boolean; // gaarsdal:events:v1:u:{userKey}
  writeConversation?: boolean; // gaarsdal:events:v1:{conversationId}
};

export type ReadEventsOptions = {
  start?: number; // LRANGE start
  stop?: number; // LRANGE stop
};

/**
 * Optional global redis binding for convenience (so callers can do appendConversationEventV1(event)).
 * Recommended: bind once during app boot (e.g. in an API route module init).
 */
let _redis: RedisLike | null = null;

export function setEventsRedis(redis: RedisLike) {
  _redis = redis;
}

function requireRedis(explicit?: RedisLike): RedisLike {
  if (explicit) return explicit;
  if (_redis) return _redis;
  throw new Error(
    "Events store: Redis client not set. Call setEventsRedis(redis) once at startup, or call appendConversationEventV1(redis, event, opts)."
  );
}

function safeJson(value: unknown): string {
  return JSON.stringify(value);
}

async function rpushTrim(redis: RedisLike, key: string, value: string, maxEvents: number): Promise<void> {
  await redis.rpush(key, value);
  await redis.ltrim(key, -maxEvents, -1);
}

export async function appendEvent(
  redis: RedisLike,
  event: EventEnvelope,
  opts: AppendEventOptions = {}
): Promise<void> {
  const maxEvents = opts.maxEvents ?? DEFAULT_MAX_EVENTS;

  const writeAll = opts.writeAll ?? true;
  const writeUser = opts.writeUser ?? true;
  const writeConversation = opts.writeConversation ?? true;

  const json = safeJson(event);
  const jobs: Promise<void>[] = [];

  if (writeAll) jobs.push(rpushTrim(redis, KEY_EVENTS_ALL, json, maxEvents));
  if (writeUser) jobs.push(rpushTrim(redis, KEY_EVENTS_USER(event.user_key), json, maxEvents));

  if (writeConversation) {
    const canonicalKey = KEY_EVENTS_CONVO(event.conversation_id);
    jobs.push(rpushTrim(redis, canonicalKey, json, maxEvents));

    if (DUAL_WRITE_LEGACY_BUG_KEY) {
      const legacyBugKey = KEY_EVENTS_CONVO_LEGACY_BUG(event.conversation_id);
      if (legacyBugKey !== canonicalKey) {
        jobs.push(rpushTrim(redis, legacyBugKey, json, maxEvents));
      }
    }
  }

  await Promise.all(jobs);
}

/**
 * Backwards-compatible wrapper matching the old import name.
 *
 * Supports BOTH:
 *   appendConversationEventV1(event, opts?)
 *   appendConversationEventV1(redis, event, opts?)
 */
export function appendConversationEventV1(event: EventEnvelope, opts?: AppendEventOptions): Promise<void>;
export function appendConversationEventV1(
  redis: RedisLike,
  event: EventEnvelope,
  opts?: AppendEventOptions
): Promise<void>;
export async function appendConversationEventV1(...args: any[]): Promise<void> {
  // Overload resolution
  // (redis,event,opts) OR (event,opts)
  const first = args[0];

  const looksLikeRedis =
    first &&
    typeof first === "object" &&
    typeof first.rpush === "function" &&
    typeof first.ltrim === "function" &&
    typeof first.lrange === "function";

  if (looksLikeRedis) {
    const redis = first as RedisLike;
    const event = args[1] as EventEnvelope;
    const opts = (args[2] ?? {}) as AppendEventOptions;
    return appendEvent(redis, event, opts);
  }

  const event = first as EventEnvelope;
  const opts = (args[1] ?? {}) as AppendEventOptions;
  const redis = requireRedis();
  return appendEvent(redis, event, opts);
}

export async function readConversationEvents(
  redis: RedisLike,
  conversationId: string,
  opts: ReadEventsOptions = {}
): Promise<string[]> {
  const start = opts.start ?? 0;
  const stop = opts.stop ?? -1;

  const canonicalKey = KEY_EVENTS_CONVO(conversationId);
  const legacyBugKey = KEY_EVENTS_CONVO_LEGACY_BUG(conversationId);

  const canonical = (await redis.lrange(canonicalKey, start, stop)) as string[] | null;
  if (canonical && canonical.length > 0) return canonical;

  const legacy = (await redis.lrange(legacyBugKey, start, stop)) as string[] | null;
  return legacy ?? [];
}

/**
 * Convenience overload, same pattern as appendConversationEventV1:
 *   readConversationEventsV1(conversationId, opts?)  // requires setEventsRedis()
 *   readConversationEventsV1(redis, conversationId, opts?)
 */
export function readConversationEventsV1(conversationId: string, opts?: ReadEventsOptions): Promise<string[]>;
export function readConversationEventsV1(
  redis: RedisLike,
  conversationId: string,
  opts?: ReadEventsOptions
): Promise<string[]>;
export async function readConversationEventsV1(...args: any[]): Promise<string[]> {
  const first = args[0];

  const looksLikeRedis =
    first &&
    typeof first === "object" &&
    typeof first.rpush === "function" &&
    typeof first.ltrim === "function" &&
    typeof first.lrange === "function";

  if (looksLikeRedis) {
    const redis = first as RedisLike;
    const conversationId = args[1] as string;
    const opts = (args[2] ?? {}) as ReadEventsOptions;
    return readConversationEvents(redis, conversationId, opts);
  }

  const conversationId = first as string;
  const opts = (args[1] ?? {}) as ReadEventsOptions;
  const redis = requireRedis();
  return readConversationEvents(redis, conversationId, opts);
}

/**
 * Optional helper to detect whether a conversation has data split across keys.
 * Useful for one-off migration / diagnostics.
 */
export async function diagnoseConversationEventKeys(
  redis: RedisLike,
  conversationId: string
): Promise<{
  canonicalKey: string;
  legacyBugKey: string;
  canonicalLen?: number;
  legacyBugLen?: number;
}> {
  const canonicalKey = KEY_EVENTS_CONVO(conversationId);
  const legacyBugKey = KEY_EVENTS_CONVO_LEGACY_BUG(conversationId);

  const canonicalLen = redis.llen ? Number(await redis.llen(canonicalKey)) : undefined;
  const legacyBugLen = redis.llen ? Number(await redis.llen(legacyBugKey)) : undefined;

  return { canonicalKey, legacyBugKey, canonicalLen, legacyBugLen };
}
