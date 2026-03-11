export type JournalKind = "alcohol_drink" | "alcohol_urge"

export type SchemaVersion = "v4"

export type AlcoholFields = {
  // Type-specific
  drinks?: number
  urge_0_10?: number

  // Context / triggers
  mood_tag?: string
  mood_0_10?: number
  trigger_tag?: string
  context_tag?: string

  // Coping / action
  coping_tag?: string
  action?: string

  // Craving details
  craving_peak_0_10?: number
  craving_duration_min?: number

  // Reflections: perceived consequences
  perceived_benefit_tags?: string[]
  perceived_cost_tags?: string[]
  benefit_impact_0_10?: number
  cost_impact_0_10?: number

  // Motivation
  change_intent_0_10?: number
  desired_outcome_tags?: string[]
  ambivalence_tags?: string[]
}

export type JournalEntryV4 = {
  schema_version: SchemaVersion
  entry_id: string
  kind: JournalKind

  // Event time (editable)
  ts_ms: number
  // Logged time (immutable)
  logged_ts_ms: number

  text?: string
  fields: AlcoholFields

  // Optimistic concurrency (optional)
  revision?: number
}

export type JournalChangeOp = "set" | "unset" | "append_text"

export type JournalChange = {
  op: JournalChangeOp
  path: string
  value?: unknown
}

export const JOURNAL_ENTRY_TTL_SECONDS = 365 * 24 * 60 * 60 // 12 months

// Accept backdating; clamp on server to avoid nonsense
export const MAX_PAST_MS = 365 * 24 * 60 * 60 * 1000 // 365 days
export const MAX_FUTURE_MS = 24 * 60 * 60 * 1000 // 24 hours

export function clamp0to10(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(10, Math.round(n)))
}

export function clampNonNegInt(n: number, max: number): number {
  if (!Number.isFinite(n)) return 0
  const v = Math.max(0, Math.min(max, Math.round(n)))
  return v
}

export function normalizeText(v: unknown, maxLen = 2000): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (!s) return undefined
  return s.length > maxLen ? s.slice(0, maxLen) : s
}

export function nowMs(): number {
  return Date.now()
}

export function clampTsMs(tsMs: number, now = nowMs()): number {
  if (!Number.isFinite(tsMs)) return now
  const min = now - MAX_PAST_MS
  const max = now + MAX_FUTURE_MS
  return Math.max(min, Math.min(max, Math.round(tsMs)))
}
