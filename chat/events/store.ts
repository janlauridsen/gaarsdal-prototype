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

const KEY_EVENTS_ALL = `${KEY_EVENTS_PREFIX_CANONICAL}all`;
const KEY_EVENTS_USER = (userKey: string) => `${KEY_EVENTS_PREFIX_CANONICAL}u:${userKey}`;
const KEY_EVENTS_CONVO = (conversationId: string) => `${KEY_EVENTS_PREFIX_CANONICAL}${conversationId}`;
const KEY_EVENTS_CONVO_LEGACY_BUG = (conversationId: string) =>
  `${KEY_EVENTS_PREFIX_LEGACY_BUG}${conversationId}`;

// Keep last N events (same as your logs: -4000 -1)
const DEFAULT_MAX_EVENTS = 4000;

// If you *must* keep dual-write temporarily, set to true.
// NOTE: true will recreate the duplication you see in logs.
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

function safeJson(value: unknown): string {
  return JSON.stringify(value);
}

async function rpushTrim(redis: RedisLike, key: string, value: string, maxEvents: number): Promise<void> {
  await redis.rpush(key, value);
  await redis.ltrim(key, -maxEvents, -1);
}

/**
 * Optional: configure a default Redis instance for legacy call sites that do:
 *   appendConversationEventV1(event)
 */
let DEFAULT_REDIS: RedisLike | null = null;

export function configureEventsStore(redis: RedisLike): void {
  DEFAULT_REDIS = redis;
}

function requireDefaultRedis(): RedisLike {
  if (!DEFAULT_REDIS) {
    throw new Error(
      "Events store not configured. Call configureEventsStore(redis) once, or use appendConversationEventV1(redis, event, opts)."
    );
  }
  return DEFAULT_REDIS;
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
 * Back-compat export expected by pages/api/chat.ts
 *
 * Supports:
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
  // Legacy: (event, opts?)
  if (args.length === 1 || (args.length === 2 && typeof args[1] === "object" && !("rpush" in args[1]))) {
    const event = args[0] as EventEnvelope;
    const opts = args[1] as AppendEventOptions | undefined;
    return appendEvent(requireDefaultRedis(), event, opts ?? {});
  }

  // New: (redis, event, opts?)
  const redis = args[0] as RedisLike;
  const event = args[1] as EventEnvelope;
  const opts = args[2] as AppendEventOptions | undefined;
  return appendEvent(redis, event, opts ?? {});
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
 * Optional helper to detect whether a conversation has data split across keys.
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
