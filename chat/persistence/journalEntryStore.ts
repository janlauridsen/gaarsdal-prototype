import { getRedisClient } from "./redis"

/**
 * Journal entries are stored outside conversation state to avoid payload growth.
 *
 * Data model:
 * - ZSET key: gaarsdal:journal:entries:<journalId>
 * - score: ts_ms
 * - member: JSON string of entry
 */

const ENTRIES_PREFIX = "gaarsdal:journal:entries:"

export const JOURNAL_ENTRIES_TTL_SECONDS = 365 * 24 * 60 * 60 // 12 months

function key(journalId: string): string {
  return `${ENTRIES_PREFIX}${journalId}`
}

export type JournalEntry = {
  entry_id: string
  ts_ms: number
  schema_version: string
  kind: string
  text?: string
  fields?: Record<string, unknown>
  quality?: Record<string, unknown>
}

function safeParseJson(v: unknown): any {
  if (v == null) return null
  if (typeof v === "object") return v
  if (typeof v !== "string") return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export async function appendJournalEntry(journalId: string, entry: JournalEntry): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const anyClient = client as any
  const k = key(journalId)
  const score = typeof entry.ts_ms === "number" && Number.isFinite(entry.ts_ms) ? entry.ts_ms : Date.now()
  const member = JSON.stringify(entry)

  try {
    await anyClient.zadd(k, { score, member })
  } catch {
    await anyClient.zadd(k, score, member)
  }

  try {
    await anyClient.expire(k, JOURNAL_ENTRIES_TTL_SECONDS)
  } catch {
    // ignore
  }
}

export async function appendManyJournalEntries(journalId: string, entries: JournalEntry[]): Promise<void> {
  for (const e of entries) {
    await appendJournalEntry(journalId, e)
  }
}

export async function readJournalEntriesTail(journalId: string, limit: number): Promise<JournalEntry[]> {
  const client = getRedisClient()
  if (!client) return []
  const anyClient = client as any
  const k = key(journalId)
  const n = Math.max(1, Math.min(limit, 500))

  let raw: any[] = []
  try {
    raw = await anyClient.zrange(k, 0, n - 1, { rev: true })
  } catch {
    try {
      raw = await anyClient.zrevrange(k, 0, n - 1)
    } catch {
      raw = []
    }
  }

  const parsed = (Array.isArray(raw) ? raw : [])
    .map(safeParseJson)
    .filter((x) => x && typeof x === "object") as JournalEntry[]

  return parsed.reverse()
}

export async function readJournalEntriesRange(
  journalId: string,
  opts: { fromTsMs?: number; toTsMs?: number; limit?: number } = {}
): Promise<JournalEntry[]> {
  const client = getRedisClient()
  if (!client) return []
  const anyClient = client as any
  const k = key(journalId)

  const from = typeof opts.fromTsMs === "number" && Number.isFinite(opts.fromTsMs) ? opts.fromTsMs : 0
  const to = typeof opts.toTsMs === "number" && Number.isFinite(opts.toTsMs) ? opts.toTsMs : Date.now()
  const limit = typeof opts.limit === "number" && Number.isFinite(opts.limit) ? Math.max(1, Math.min(opts.limit, 50000)) : 50000

  let raw: any[] = []
  try {
    raw = await anyClient.zrangebyscore(k, from, to, { offset: 0, count: limit })
  } catch {
    try {
      raw = await anyClient.zrange(k, 0, -1)
    } catch {
      raw = []
    }
  }

  const parsed = (Array.isArray(raw) ? raw : [])
    .map(safeParseJson)
    .filter((x) => x && typeof x === "object") as JournalEntry[]

  return parsed
    .filter((e) => typeof e.ts_ms === "number" && e.ts_ms >= from && e.ts_ms <= to)
    .sort((a, b) => (a.ts_ms ?? 0) - (b.ts_ms ?? 0))
    .slice(-limit)
}
