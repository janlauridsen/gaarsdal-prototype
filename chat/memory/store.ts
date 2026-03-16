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
    direct_answers_first: number
    reflection_preference: number
    practical_next_steps: number
  }

  /**
   * V2+: platform core and tracks.
   * These are designed to be low-noise and safe to reuse across programs.
   */
  core: {
    preferences: {
      preferred_tone: string
      short_answers: number
      direct_answers_first: number
      reflection_preference: number
      practical_next_steps: number
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
    typeof v.pref.direct_answers_first === "number" &&
    typeof v.pref.reflection_preference === "number" &&
    typeof v.pref.practical_next_steps === "number" &&
    typeof v.core === "object" &&
    v.core !== null &&
    typeof v.core.preferences === "object" &&
    v.core.preferences !== null &&
    typeof v.core.preferences.short_answers === "number" &&
    typeof v.core.preferences.direct_answers_first === "number" &&
    typeof v.core.preferences.reflection_preference === "number" &&
    typeof v.core.preferences.practical_next_steps === "number" &&
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

  const legacy = parseJson<any>(raw)
  if (legacy && typeof legacy === "object" && legacy !== null) {
    return migrateLegacyProfile(legacy as any)
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
    pref: {
      short_answers: 0.5,
      direct_answers_first: 0.55,
      reflection_preference: 0.45,
      practical_next_steps: 0.5,
    },

    core: {
      preferences: {
        preferred_tone: "",
        short_answers: 0.5,
        direct_answers_first: 0.55,
        reflection_preference: 0.45,
        practical_next_steps: 0.5,
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

function migrateLegacyProfile(v1: any): UserProfile {
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

  if (typeof v1?.pref?.direct_answers_first === "number") {
    base.pref.direct_answers_first = v1.pref.direct_answers_first
    base.core.preferences.direct_answers_first = v1.pref.direct_answers_first
  }

  if (typeof v1?.pref?.reflection_preference === "number") {
    base.pref.reflection_preference = v1.pref.reflection_preference
    base.core.preferences.reflection_preference = v1.pref.reflection_preference
  }

  if (typeof v1?.pref?.practical_next_steps === "number") {
    base.pref.practical_next_steps = v1.pref.practical_next_steps
    base.core.preferences.practical_next_steps = v1.pref.practical_next_steps
  }

  if (typeof v1?.core?.preferences?.preferred_tone === "string") {
    base.core.preferences.preferred_tone = v1.core.preferences.preferred_tone
  }

  if (Array.isArray(v1?.core?.semantic?.topics)) {
    base.core.semantic.topics = v1.core.semantic.topics.filter((x: unknown): x is string => typeof x === "string").slice(0, 50)
  }

  if (Array.isArray(v1?.core?.semantic?.goals)) {
    base.core.semantic.goals = v1.core.semantic.goals.filter((x: unknown): x is string => typeof x === "string").slice(0, 20)
  }

  if (typeof v1?.core?.semantic?.last_confidence === "number") {
    base.core.semantic.last_confidence = v1.core.semantic.last_confidence
  }

  if (v1?.core?.semantic?.last_chips !== undefined) {
    base.core.semantic.last_chips = v1.core.semantic.last_chips
  }

  if (typeof v1?.tracks === "object" && v1.tracks !== null) {
    base.tracks.active_track_id = typeof v1.tracks.active_track_id === "string" ? v1.tracks.active_track_id : null
    base.tracks.items = Array.isArray(v1.tracks.items) ? v1.tracks.items : []
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
  const triageRaw = state?.meta?.["triage.topic_tags"]?.value
  if (Array.isArray(triageRaw)) {
    return triageRaw.filter((t) => typeof t === "string") as string[]
  }

  const hypnoRaw = state?.meta?.["gen_hypno.topic_tags"]?.value
  if (Array.isArray(hypnoRaw)) {
    return hypnoRaw.filter((t) => typeof t === "string") as string[]
  }

  return []
}

function observeShortAnswerPreference(userText: string): number | null {
  const len = userText.trim().length
  if (len === 0) return null
  if (len <= 30) return 0.75
  if (len <= 120) return 0.55
  return 0.35
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function observeDirectAnswerPreference(userText: string): number | null {
  const t = normalizeText(userText)
  if (!t) return null

  if (["pris", "hvad koster", "hvor", "adresse", "telefon", "mail", "kan det", "virker det", "hvordan foregår"].some((x) => t.includes(x))) {
    return 0.72
  }

  if (["jeg forstår ikke hvorfor", "mønster", "reaktion", "føler", "lægger mærke", "tænker meget"].some((x) => t.includes(x))) {
    return 0.4
  }

  return 0.55
}

function observeReflectionPreference(userText: string): number | null {
  const t = normalizeText(userText)
  if (!t) return null

  if (["mønster", "reaktion", "hvorfor", "jeg lægger mærke", "føler", "tanker", "triggere", "vaner"].some((x) => t.includes(x))) {
    return 0.68
  }

  if (["pris", "adresse", "telefon", "booking", "kontakt"].some((x) => t.includes(x))) {
    return 0.32
  }

  return 0.48
}

function observePracticalNextStepPreference(userText: string): number | null {
  const t = normalizeText(userText)
  if (!t) return null

  if (["næste skridt", "hvordan kommer jeg videre", "hvad gør jeg", "kontakt", "booke", "pris", "kan jeg få en tid"].some((x) => t.includes(x))) {
    return 0.72
  }

  if (["jeg vil bare forstå", "jeg er nysgerrig", "jeg undersøger", "hvordan hænger det sammen"].some((x) => t.includes(x))) {
    return 0.38
  }

  return 0.5
}

function syncCorePreferences(profile: UserProfile): void {
  profile.core.preferences.short_answers = profile.pref.short_answers
  profile.core.preferences.direct_answers_first = profile.pref.direct_answers_first
  profile.core.preferences.reflection_preference = profile.pref.reflection_preference
  profile.core.preferences.practical_next_steps = profile.pref.practical_next_steps
}

export async function recordTurn(params: {
  userKey: string
  conversationId: string
  state: ConversationState
  userText?: string
  assistantText?: string
  transitionType?: string
  includeText?: boolean
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const ts = nowIso()
  const includeText = params.includeText !== false

  const metaSnapshot: Record<string, unknown> = {}
  const includeKeys = [
    "triage.outcome",
    "triage.summary",
    "triage.topic_tags",
    "triage.user_goal",
    "triage.confidence",
    "gen_hypno.topic_tags",
    "dialog.mode",
    "dialog.relational_state",
  ]
  for (const k of includeKeys) {
    if (params.state.meta?.[k]?.value !== undefined) {
      metaSnapshot[k] = params.state.meta[k].value
    }
  }

  const events: MemoryEvent[] = []
  if (includeText && params.userText) {
    events.push({
      ts,
      conversation_id: params.conversationId,
      node: params.state.active_node,
      type: "user",
      text: params.userText,
    })
  }
  if (includeText && params.assistantText) {
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
    const shortObs = observeShortAnswerPreference(params.userText)
    if (shortObs !== null) {
      profile.pref.short_answers = clamp01(ewma(profile.pref.short_answers, shortObs, 0.08))
    }

    const directObs = observeDirectAnswerPreference(params.userText)
    if (directObs !== null) {
      profile.pref.direct_answers_first = clamp01(ewma(profile.pref.direct_answers_first, directObs, 0.08))
    }

    const reflectionObs = observeReflectionPreference(params.userText)
    if (reflectionObs !== null) {
      profile.pref.reflection_preference = clamp01(ewma(profile.pref.reflection_preference, reflectionObs, 0.08))
    }

    const practicalObs = observePracticalNextStepPreference(params.userText)
    if (practicalObs !== null) {
      profile.pref.practical_next_steps = clamp01(ewma(profile.pref.practical_next_steps, practicalObs, 0.08))
    }
  }

  syncCorePreferences(profile)

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

function describePreference(label: string, value: number, high: string, low: string): string | null {
  if (value >= 0.62) return `- ${label}: ${high}`
  if (value <= 0.38) return `- ${label}: ${low}`
  return null
}

export function buildUserProfilePromptContext(profile: UserProfile | null): string {
  if (!profile) return ""

  const lines: string[] = []

  const shortLine = describePreference(
    "svarlængde",
    profile.pref.short_answers,
    "brugeren reagerer ofte godt på korte eller kompakte svar",
    "brugeren tåler ofte lidt mere forklaring før svaret rundes af"
  )
  const directLine = describePreference(
    "svarstil",
    profile.pref.direct_answers_first,
    "svar gerne direkte først og forklar derefter kort",
    "det kan godt være nyttigt at lande emnet roligt før selve forklaringen"
  )
  const reflectionLine = describePreference(
    "refleksionsniveau",
    profile.pref.reflection_preference,
    "brugeren søger ofte mening i mønstre, reaktioner eller vaner",
    "brugeren søger ikke nødvendigvis refleksion med det samme"
  )
  const practicalLine = describePreference(
    "næste skridt",
    profile.pref.practical_next_steps,
    "konkrete næste skridt hjælper ofte denne bruger",
    "brugeren søger ikke altid et handlingsspor i samme svar"
  )

  for (const line of [shortLine, directLine, reflectionLine, practicalLine]) {
    if (line) lines.push(line)
  }

  const topics = profile.core.semantic.topics.slice(0, 5)
  if (topics.length) {
    lines.push(`- kendte temaer: ${topics.join(", ")}`)
  }

  const goals = profile.core.semantic.goals.slice(0, 3)
  if (goals.length) {
    lines.push(`- kendte mål: ${goals.join(", ")}`)
  }

  if (!lines.length) return ""
  return lines.join("\n")
}
