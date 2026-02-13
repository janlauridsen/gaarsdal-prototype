import { getRedisClient } from "../persistence/redis"
import type { ConversationState } from "../kernel/types"

export type MemoryEvent = {
  ts: string
  conversation_id: string
  node: string
  type: "user" | "assistant" | "transition"
  text?: string
  transition_type?: string
  meta?: Record<string, unknown>
}

export type UserProfile = {
  version: number
  updated_at: string
  first_seen_at: string
  last_seen_at: string
  last_node: string
  node_counts: Record<string, number>
  topic_scores: Record<string, number>
  pref: {
    short_answers: number
  }
}

const PROFILE_KEY_PREFIX = "gaarsdal:profile:"
const EVENTS_KEY_PREFIX = "gaarsdal:memory:events:"

const MAX_EVENTS = 500

function profileKey(userKey: string): string {
  return `${PROFILE_KEY_PREFIX}${userKey}`
}

function eventsKey(userKey: string): string {
  return `${EVENTS_KEY_PREFIX}${userKey}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw !== "string") return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function readUserProfile(userKey: string): Promise<UserProfile | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(profileKey(userKey))
  return parseJson<UserProfile>(raw)
}

function defaultProfile(params: { now: string; lastNode: string }): UserProfile {
  return {
    version: 1,
    updated_at: params.now,
    first_seen_at: params.now,
    last_seen_at: params.now,
    last_node: params.lastNode,
    node_counts: {},
    topic_scores: {},
    pref: { short_answers: 0.5 },
  }
}

function ewma(oldValue: number, observation: number, alpha: number): number {
  return oldValue * (1 - alpha) + observation * alpha
}

function bumpCount(map: Record<string, number>, k: string, by = 1): void {
  map[k] = (map[k] ?? 0) + by
}

function bumpScore(map: Record<string, number>, k: string, by: number): void {
  map[k] = (map[k] ?? 0) + by
}

function extractTopicTags(state: ConversationState): string[] {
  const raw = state?.meta?.["triage.topic_tags"]?.value
  if (!Array.isArray(raw)) return []
  return raw.filter((t) => typeof t === "string") as string[]
}

function observeShortAnswerPreference(userText: string): number | null {
  const len = userText.trim().length
  if (len === 0) return null
  if (len <= 30) return 0.75
  if (len <= 120) return 0.55
  return 0.35
}

export async function recordTurn(params: {
  userKey: string
  conversationId: string
  state: ConversationState
  userText?: string
  assistantText?: string
  transitionType?: string
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const ts = nowIso()

  const metaSnapshot: Record<string, unknown> = {}
  const includeKeys = [
    "triage.outcome",
    "triage.summary",
    "triage.topic_tags",
    "triage.user_goal",
    "triage.confidence",
  ]
  for (const k of includeKeys) {
    if (params.state.meta?.[k]?.value !== undefined) {
      metaSnapshot[k] = params.state.meta[k].value
    }
  }

  const events: MemoryEvent[] = []
  if (params.userText) {
    events.push({
      ts,
      conversation_id: params.conversationId,
      node: params.state.active_node,
      type: "user",
      text: params.userText,
    })
  }
  if (params.assistantText) {
    events.push({
      ts,
      conversation_id: params.conversationId,
      node: params.state.active_node,
      type: "assistant",
      text: params.assistantText,
    })
  }
  events.push({
    ts,
    conversation_id: params.conversationId,
    node: params.state.active_node,
    type: "transition",
    transition_type: params.transitionType,
    meta: Object.keys(metaSnapshot).length ? metaSnapshot : undefined,
  })

  for (const e of events) {
    await client.rpush(eventsKey(params.userKey), JSON.stringify(e))
  }
  await client.ltrim(eventsKey(params.userKey), -MAX_EVENTS, -1)
  await client.expire(eventsKey(params.userKey), params.ttlSeconds)

  const rawProfile = await client.get<unknown>(profileKey(params.userKey))
  const existing = parseJson<UserProfile>(rawProfile)
  const profile = existing ?? defaultProfile({ now: ts, lastNode: params.state.active_node })

  profile.updated_at = ts
  profile.last_seen_at = ts
  profile.last_node = params.state.active_node
  bumpCount(profile.node_counts, params.state.active_node, 1)

  const tags = extractTopicTags(params.state)
  for (const t of tags) bumpScore(profile.topic_scores, t, 0.2)

  if (params.userText) {
    const obs = observeShortAnswerPreference(params.userText)
    if (obs !== null) {
      profile.pref.short_answers = clamp01(ewma(profile.pref.short_answers, obs, 0.08))
    }
  }

  await client.set(profileKey(params.userKey), JSON.stringify(profile), {
    ex: params.ttlSeconds,
  })
}

export async function readMemoryEvents(userKey: string, limit = 50): Promise<MemoryEvent[]> {
  const client = getRedisClient()
  if (!client) return []
  const items = await client.lrange<unknown>(eventsKey(userKey), -limit, -1)
  return items.map((x) => parseJson<MemoryEvent>(x)).filter((x): x is MemoryEvent => Boolean(x))
}
