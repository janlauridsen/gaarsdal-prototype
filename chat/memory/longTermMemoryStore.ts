import { getRedisClient } from "../persistence/redis"

/**
 * Plane C — Long-term memory (v23): Themes + MemoryFacts (passive storage).
 * No prompt/context integration here yet.
 */

export type ThemeStatus = "active" | "dormant" | "archived"
export type FactStatus = "suggested" | "canonical" | "rejected"

export type Theme = {
  theme_id: string
  label: string
  status: ThemeStatus
  created_at: number
  updated_at: number
  origin: "user_selected" | "system_suggested" | "imported"
}

export type MemoryFact = {
  fact_id: string
  key: string
  value: any
  status: FactStatus
  confidence?: number
  created_at: number
  updated_at: number
  provenance: {
    created_by: string
    last_edited_by?: string
  }
  edit_history?: Array<{
    ts: number
    editor: string
    prev_value?: any
    next_value?: any
    note?: string
  }>
}

const KEY_PREFIX = "gaarsdal:mem:v23:"
const KEY_THEMES_INDEX = (userKey: string) => `${KEY_PREFIX}u:${userKey}:themes`
const KEY_THEME = (userKey: string, themeId: string) => `${KEY_PREFIX}u:${userKey}:theme:${themeId}`

const KEY_FACTS_INDEX = (userKey: string) => `${KEY_PREFIX}u:${userKey}:facts`
const KEY_FACT = (userKey: string, factId: string) => `${KEY_PREFIX}u:${userKey}:fact:${factId}`

function nowMs(): number {
  return Date.now()
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && raw !== null) return raw as T
  return null
}

function isTheme(v: unknown): v is Theme {
  if (typeof v !== "object" || v === null) return false
  const x = v as any
  return (
    typeof x.theme_id === "string" &&
    typeof x.label === "string" &&
    (x.status === "active" || x.status === "dormant" || x.status === "archived") &&
    typeof x.created_at === "number" &&
    typeof x.updated_at === "number" &&
    (x.origin === "user_selected" || x.origin === "system_suggested" || x.origin === "imported")
  )
}

function isMemoryFact(v: unknown): v is MemoryFact {
  if (typeof v !== "object" || v === null) return false
  const x = v as any
  return (
    typeof x.fact_id === "string" &&
    typeof x.key === "string" &&
    "value" in x &&
    (x.status === "suggested" || x.status === "canonical" || x.status === "rejected") &&
    typeof x.created_at === "number" &&
    typeof x.updated_at === "number" &&
    typeof x.provenance === "object" &&
    x.provenance !== null &&
    typeof x.provenance.created_by === "string"
  )
}

/**
 * Create or update a Theme.
 * This is safe to call idempotently with the same values.
 */
export async function upsertTheme(params: {
  userKey: string
  theme: Theme
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.sadd(KEY_THEMES_INDEX(params.userKey), params.theme.theme_id)
  await client.set(KEY_THEME(params.userKey, params.theme.theme_id), JSON.stringify(params.theme), {
    ex: params.ttlSeconds,
  })
}

/**
 * Read all themes for a user (best effort).
 */
export async function readThemes(params: {
  userKey: string
  limit?: number
}): Promise<Theme[]> {
  const client = getRedisClient()
  if (!client) return []

  const ids = await client.smembers<string[]>(KEY_THEMES_INDEX(params.userKey))
  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 200)) : 200

  const out: Theme[] = []
  for (const id of (ids ?? []).slice(0, limit)) {
    const raw = await client.get<unknown>(KEY_THEME(params.userKey, id))
    const parsed = parseJson<Theme>(raw)
    if (parsed && isTheme(parsed)) out.push(parsed)
  }

  out.sort((a, b) => b.updated_at - a.updated_at)
  return out
}

/**
 * Create or update a MemoryFact.
 */
export async function upsertFact(params: {
  userKey: string
  fact: MemoryFact
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.sadd(KEY_FACTS_INDEX(params.userKey), params.fact.fact_id)
  await client.set(KEY_FACT(params.userKey, params.fact.fact_id), JSON.stringify(params.fact), {
    ex: params.ttlSeconds,
  })
}

/**
 * Read facts for a user (best effort).
 * Optional status filter.
 */
export async function readFacts(params: {
  userKey: string
  limit?: number
  status?: FactStatus
}): Promise<MemoryFact[]> {
  const client = getRedisClient()
  if (!client) return []

  const ids = await client.smembers<string[]>(KEY_FACTS_INDEX(params.userKey))
  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 500

  const out: MemoryFact[] = []
  for (const id of (ids ?? []).slice(0, limit)) {
    const raw = await client.get<unknown>(KEY_FACT(params.userKey, id))
    const parsed = parseJson<MemoryFact>(raw)
    if (parsed && isMemoryFact(parsed)) out.push(parsed)
  }

  const filtered = params.status ? out.filter((f) => f.status === params.status) : out
  filtered.sort((a, b) => b.updated_at - a.updated_at)
  return filtered
}

/**
 * Convenience: create a suggested fact (no-op if caller doesn't use it yet).
 * Provided for Step 4 async jobs later.
 */
export function makeSuggestedFact(params: {
  fact_id: string
  key: string
  value: any
  created_by: string
  confidence?: number
}): MemoryFact {
  const ts = nowMs()
  return {
    fact_id: params.fact_id,
    key: params.key,
    value: params.value,
    status: "suggested",
    confidence: params.confidence,
    created_at: ts,
    updated_at: ts,
    provenance: { created_by: params.created_by },
    edit_history: [],
  }
}
