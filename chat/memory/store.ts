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

  /**
   * V2+: platform core and tracks.
   * These are designed to be low-noise and safe to reuse across programs.
   */
  core: {
    preferences: {
      preferred_tone: string
      short_answers: number
    }
    semantic: {
      topics: string[]
      goals: string[]
      last_chips?: unknown
      last_confidence?: number
    }
  }

  tracks: {
    active_track_id: string | null
    items: Track[]
  }
}

export type TrackStatus = "active" | "dormant" | "closed"

export type Track = {
  track_id: string
  program: string
  status: TrackStatus
  title: string
  created_at: string
  updated_at: string
  core_overlay: {
    topics: string[]
    goals: string[]
    context: {
      time_patterns: string
      situational_triggers: string
      relational_patterns: string
    }
    help_orientation: {
      interest_in_methods: string[]
      preferred_tone: string
      support_direction: string
    }
  }
  /** Program-specific payloads, versioned by producer */
  extensions: Record<string, unknown>
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

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== "object" || value === null) return false
  const v = value as any

  return (
    typeof v.version === "number" &&
    typeof v.updated_at === "string" &&
    typeof v.first_seen_at === "string" &&
    typeof v.last_seen_at === "string" &&
    typeof v.last_node === "string" &&
    typeof v.node_counts === "object" &&
    v.node_counts !== null &&
    typeof v.topic_scores === "object" &&
    v.topic_scores !== null &&
    typeof v.pref === "object" &&
    v.pref !== null &&
    typeof v.pref.short_answers === "number" &&
    typeof v.core === "object" &&
    v.core !== null &&
    typeof v.core.preferences === "object" &&
    v.core.preferences !== null &&
    typeof v.core.preferences.short_answers === "number" &&
    typeof v.core.semantic === "object" &&
    v.core.semantic !== null &&
    Array.isArray(v.core.semantic.topics) &&
    Array.isArray(v.core.semantic.goals) &&
    typeof v.tracks === "object" &&
    v.tracks !== null &&
    (typeof v.tracks.active_track_id === "string" || v.tracks.active_track_id === null) &&
    Array.isArray(v.tracks.items)
  )
}

function parseJson<T>(raw: unknown, guard?: (v: unknown) => v is T): T | null {
  // Upstash may return string or parsed object.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (guard) return guard(parsed) ? parsed : null
      return parsed as T
    } catch {
      return null
    }
  }

  if (guard) return guard(raw) ? (raw as T) : null
  if (typeof raw === "object" && raw !== null) return raw as T
  return null
}

export async function readUserProfile(userKey: string): Promise<UserProfile | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(profileKey(userKey))
  const parsed = parseJson<UserProfile>(raw, isUserProfile)
  if (parsed) return parsed

  // Migration from v1 profile (no core/tracks)
  const legacy = parseJson<any>(raw)
  if (legacy && typeof legacy === "object" && legacy !== null && legacy.version === 1) {
    return migrateV1ToV2(legacy as any)
  }

  return null
}

function defaultProfile(params: { now: string; lastNode: string }): UserProfile {
  return {
    version: 2,
    updated_at: params.now,
    first_seen_at: params.now,
    last_seen_at: params.now,
    last_node: params.lastNode,
    node_counts: {},
    topic_scores: {},
    pref: { short_answers: 0.5 },

    core: {
      preferences: {
        preferred_tone: "",
        short_answers: 0.5,
      },
      semantic: {
        topics: [],
        goals: [],
      },
    },

    tracks: {
      active_track_id: null,
      items: [],
    },
  }
}

function migrateV1ToV2(v1: any): UserProfile {
  const now = typeof v1.updated_at === "string" ? v1.updated_at : nowIso()
  const lastNode = typeof v1.last_node === "string" ? v1.last_node : "HOME"
  const base = defaultProfile({ now, lastNode })

  base.first_seen_at = typeof v1.first_seen_at === "string" ? v1.first_seen_at : base.first_seen_at
  base.last_seen_at = typeof v1.last_seen_at === "string" ? v1.last_seen_at : base.last_seen_at
  base.updated_at = now
  base.last_node = lastNode
  base.node_counts = typeof v1.node_counts === "object" && v1.node_counts ? v1.node_counts : {}
  base.topic_scores = typeof v1.topic_scores === "object" && v1.topic_scores ? v1.topic_scores : {}
  if (typeof v1?.pref?.short_answers === "number") {
    base.pref.short_answers = v1.pref.short_answers
    base.core.preferences.short_answers = v1.pref.short_answers
  }
  return base
}

export async function writeUserProfile(params: {
  userKey: string
  profile: UserProfile
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(profileKey(params.userKey), JSON.stringify(params.profile), {
    ex: params.ttlSeconds,
  })
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
  const existing = parseJson<UserProfile>(rawProfile, isUserProfile)

  const profile = existing ?? defaultProfile({ now: ts, lastNode: params.state.active_node })

  // IMPORTANT: preserve first_seen_at if profile already existed
  if (existing) {
    profile.first_seen_at = existing.first_seen_at
  }

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
      profile.core.preferences.short_answers = profile.pref.short_answers
    }
  }

  await writeUserProfile({ userKey: params.userKey, profile, ttlSeconds: params.ttlSeconds })
}

export async function readMemoryEvents(userKey: string, limit = 50): Promise<MemoryEvent[]> {
  const client = getRedisClient()
  if (!client) return []

  const items = await client.lrange<unknown>(eventsKey(userKey), -limit, -1)
  return items
    .map((x) => parseJson<MemoryEvent>(x))
    .filter((x): x is MemoryEvent => Boolean(x))
}
