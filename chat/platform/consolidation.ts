import type { ConversationState } from "../kernel/types"
import type { UserProfile, Track } from "../memory/store"

export type EvidenceSnippet = {
  quote: string
  ts: string
  node: string
}

export type ConsolidationResult = {
  profile: UserProfile
  updated: boolean
}

function nowIso(): string {
  return new Date().toISOString()
}

function ensureArrayStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === "string") as string[]
}

function readMetaString(state: ConversationState, key: string): string {
  const raw = state?.meta?.[key]?.value
  return typeof raw === "string" ? raw : ""
}

function readMetaNumber(state: ConversationState, key: string): number {
  const raw = state?.meta?.[key]?.value
  return typeof raw === "number" ? raw : 0
}

/**
 * Minimal V1 consolidation:
 * - Promote selected triage outputs into profile.core.semantic
 * - Keep changes conservative to avoid cross-track noise.
 */
export function consolidateV1(params: {
  profile: UserProfile
  state: ConversationState
}): ConsolidationResult {
  const { profile, state } = params
  const ts = nowIso()
  let updated = false

  profile.updated_at = ts
  profile.last_seen_at = ts
  profile.last_node = state.active_node

  // Core preferences are updated elsewhere (EWMA) in recordTurn.
  // Promote triage tags/goals into core semantic hints.
  const tags = ensureArrayStrings(state?.meta?.["triage.topic_tags"]?.value)
  if (tags.length) {
    const existing = new Set(profile.core.semantic.topics)
    for (const t of tags) existing.add(t)
    profile.core.semantic.topics = Array.from(existing).slice(0, 50)
    updated = true
  }

  const goal = readMetaString(state, "triage.user_goal")
  if (goal) {
    if (!profile.core.semantic.goals.includes(goal)) {
      profile.core.semantic.goals = [goal, ...profile.core.semantic.goals].slice(0, 20)
      updated = true
    }
  }

  const chips = state?.meta?.["triage.chips"]?.value
  if (Array.isArray(chips)) {
    profile.core.semantic.last_chips = chips
    updated = true
  }

  const conf = readMetaNumber(state, "triage.confidence")
  if (conf > 0) {
    profile.core.semantic.last_confidence = conf
    updated = true
  }

  return { profile, updated }
}

/**
 * Track helper: create/activate a track with minimal fields.
 * Track assignment/routing is expanded in PR2.
 */
export function ensureTrack(params: {
  profile: UserProfile
  program: string
  title?: string
}): { profile: UserProfile; track: Track; created: boolean } {
  const { profile, program } = params
  const ts = nowIso()

  const existing = profile.tracks.items.find((t) => t.program === program && t.status === "active")
  if (existing) {
    profile.tracks.active_track_id = existing.track_id
    existing.updated_at = ts
    return { profile, track: existing, created: false }
  }

  const track: Track = {
    track_id: `t_${Math.random().toString(36).slice(2, 10)}`,
    program,
    status: "active",
    title: params.title ?? "",
    created_at: ts,
    updated_at: ts,
    core_overlay: {
      topics: [],
      goals: [],
      context: { time_patterns: "", situational_triggers: "", relational_patterns: "" },
      help_orientation: { preferred_tone: "", support_direction: "", interest_in_methods: [] },
    },
    extensions: {},
  }

  profile.tracks.items.unshift(track)
  profile.tracks.items = profile.tracks.items.slice(0, 20)
  profile.tracks.active_track_id = track.track_id
  return { profile, track, created: true }
}
