// chat/memory/longTermMemoryStore.ts
import { getRedisClient } from "../persistence/redis"
import { nowMs } from "../utils/time"

/**
 * Plane C — Long-term memory (v23): Themes + Episodes + MemoryFacts.
 * Passive storage only (no prompt integration here).
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

export type Episode = {
  episode_id: string
  theme_id: string
  started_at: number
  ended_at?: number
  summary_short?: string
  open_loops?: string[]
  updated_at: number
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

const KEY_EPISODES_INDEX = (userKey: string, themeId: string) => `${KEY_PREFIX}u:${userKey}:theme:${themeId}:episodes`
const KEY_EPISODE = (userKey: string, episodeId: string) => `${KEY_PREFIX}u:${userKey}:episode:${episodeId}`

const KEY_FACTS_INDEX = (userKey: string) => `${KEY_PREFIX}u:${userKey}:facts`
const KEY_FACT = (userKey: string, factId: string) => `${KEY_PREFIX}u:${userKey}:fact:${factId}`


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

function isEpisode(v: unknown): v is Episode {
  if (typeof v !== "object" || v === null) return false
  const x = v as any
  return (
    typeof x.episode_id === "string" &&
    typeof x.theme_id === "string" &&
    typeof x.started_at === "number" &&
    typeof x.updated_at === "number"
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

function threadThemeId(conversationId: string): string {
  const safeConv = (conversationId ?? "").trim() || "unknown"
  return `theme:thread:${safeConv}`
}

function threadEpisodeId(conversationId: string): string {
  const safeConv = (conversationId ?? "").trim() || "unknown"
  return `episode:thread:${safeConv}:1`
}

/**
 * Create or update a Theme (idempotent).
 */
export async function upsertTheme(params: {
  userKey: string
  theme: Theme
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.sadd(KEY_THEMES_INDEX(params.userKey), params.theme.theme_id)
  await client.expire(KEY_THEMES_INDEX(params.userKey), params.ttlSeconds)
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
 * Create or update an Episode (idempotent).
 */
export async function upsertEpisode(params: {
  userKey: string
  episode: Episode
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.sadd(KEY_EPISODES_INDEX(params.userKey, params.episode.theme_id), params.episode.episode_id)
  await client.expire(KEY_EPISODES_INDEX(params.userKey, params.episode.theme_id), params.ttlSeconds)
  await client.set(KEY_EPISODE(params.userKey, params.episode.episode_id), JSON.stringify(params.episode), {
    ex: params.ttlSeconds,
  })
}

/**
 * Read episodes for a theme.
 */
export async function readEpisodes(params: {
  userKey: string
  themeId: string
  limit?: number
}): Promise<Episode[]> {
  const client = getRedisClient()
  if (!client) return []

  const ids = await client.smembers<string[]>(KEY_EPISODES_INDEX(params.userKey, params.themeId))
  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 100)) : 100

  const out: Episode[] = []
  for (const id of (ids ?? []).slice(0, limit)) {
    const raw = await client.get<unknown>(KEY_EPISODE(params.userKey, id))
    const parsed = parseJson<Episode>(raw)
    if (parsed && isEpisode(parsed)) out.push(parsed)
  }

  out.sort((a, b) => b.updated_at - a.updated_at)
  return out
}

export async function readEpisode(params: {
  userKey: string
  episodeId: string
}): Promise<Episode | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(KEY_EPISODE(params.userKey, params.episodeId))
  const parsed = parseJson<Episode>(raw)
  return parsed && isEpisode(parsed) ? parsed : null
}

export async function readTheme(params: {
  userKey: string
  themeId: string
}): Promise<Theme | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(KEY_THEME(params.userKey, params.themeId))
  const parsed = parseJson<Theme>(raw)
  return parsed && isTheme(parsed) ? parsed : null
}

/**
 * Read an existing thread-bound Theme+Episode without writing.
 */
export async function readThreadThemeAndEpisode(params: {
  userKey: string
  conversationId: string
}): Promise<{ theme: Theme; episode: Episode } | null> {
  const themeId = threadThemeId(params.conversationId)
  const episodeId = threadEpisodeId(params.conversationId)

  const [theme, episode] = await Promise.all([
    readTheme({ userKey: params.userKey, themeId }),
    readEpisode({ userKey: params.userKey, episodeId }),
  ])

  if (!theme || !episode) return null
  return { theme, episode }
}

/**
 * Create a thread-bound Theme+Episode only if missing.
 * Existing records are returned as-is to avoid write-on-read.
 */
export async function getOrCreateThreadThemeAndEpisode(params: {
  userKey: string
  conversationId: string
  ttlSeconds: number
}): Promise<{ theme: Theme; episode: Episode }> {
  const existing = await readThreadThemeAndEpisode({
    userKey: params.userKey,
    conversationId: params.conversationId,
  })
  if (existing) return existing

  const theme_id = threadThemeId(params.conversationId)
  const episode_id = threadEpisodeId(params.conversationId)
  const ts = nowMs()

  const theme: Theme = {
    theme_id,
    label: "Samtale",
    status: "active",
    created_at: ts,
    updated_at: ts,
    origin: "system_suggested",
  }

  const episode: Episode = {
    episode_id,
    theme_id,
    started_at: ts,
    updated_at: ts,
    summary_short: undefined,
    open_loops: undefined,
  }

  await upsertTheme({ userKey: params.userKey, theme, ttlSeconds: params.ttlSeconds })
  await upsertEpisode({ userKey: params.userKey, episode, ttlSeconds: params.ttlSeconds })

  return { theme, episode }
}

/**
 * Backward-compatible alias for callers not yet migrated.
 * Semantics are create-if-missing and read-only otherwise.
 */
export async function ensureThreadThemeAndEpisode(params: {
  userKey: string
  conversationId: string
  ttlSeconds: number
}): Promise<{ theme: Theme; episode: Episode }> {
  return getOrCreateThreadThemeAndEpisode(params)
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
  await client.expire(KEY_FACTS_INDEX(params.userKey), params.ttlSeconds)
  await client.set(KEY_FACT(params.userKey, params.fact.fact_id), JSON.stringify(params.fact), {
    ex: params.ttlSeconds,
  })
}

/**
 * Read facts for a user (best effort).
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
 * Step-4 helper: Ensure a default Theme+Episode exist.
 * This is a temporary bridge until explicit theme selection UI exists.
 */
export async function ensureDefaultThemeAndEpisode(params: {
  userKey: string
  ttlSeconds: number
}): Promise<{ theme: Theme; episode: Episode }> {
  const theme_id = "theme:general"
  const episode_id = "episode:general:1"
  const ts = nowMs()

  const existingTheme = await readTheme({ userKey: params.userKey, themeId: theme_id })
  const existingEpisode = await readEpisode({ userKey: params.userKey, episodeId: episode_id })

  if (existingTheme && existingEpisode) {
    return { theme: existingTheme, episode: existingEpisode }
  }

  const theme: Theme = {
    theme_id,
    label: existingTheme?.label ?? "Generelt",
    status: existingTheme?.status ?? "active",
    created_at: existingTheme?.created_at ?? ts,
    updated_at: existingTheme?.updated_at ?? ts,
    origin: existingTheme?.origin ?? "system_suggested",
  }

  const episode: Episode = {
    episode_id,
    theme_id,
    started_at: existingEpisode?.started_at ?? ts,
    updated_at: existingEpisode?.updated_at ?? ts,
    summary_short: existingEpisode?.summary_short,
    open_loops: existingEpisode?.open_loops,
  }

  await upsertTheme({ userKey: params.userKey, theme, ttlSeconds: params.ttlSeconds })
  await upsertEpisode({ userKey: params.userKey, episode, ttlSeconds: params.ttlSeconds })

  return { theme, episode }
}
