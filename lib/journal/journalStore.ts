import { getRedisClient } from "../../chat/persistence/redis"
import { JOURNAL_ENTRY_TTL_SECONDS, JournalEntryV4, JournalKind, clampTsMs, nowMs } from "./journalSchema"

const INDEX_PREFIX = "gaarsdal:journal:entries:"
const ENTRY_PREFIX = "gaarsdal:journal:entry:"

function indexKey(journalId: string): string {
  return `${INDEX_PREFIX}${journalId}`
}

function entryKey(journalId: string, entryId: string): string {
  return `${ENTRY_PREFIX}${journalId}:${entryId}`
}

function safeJsonParse(v: unknown): any | null {
  if (!v) return null
  if (typeof v === "object") return v as any
  if (typeof v !== "string") return null
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}

export type CreateEntryInput = {
  kind: JournalKind
  ts_ms?: number
  text?: string
  fields?: Partial<JournalEntryV4["fields"]>
}

export async function createJournalEntry(journalId: string, entryId: string, input: CreateEntryInput): Promise<JournalEntryV4 | null> {
  const client = getRedisClient()
  if (!client) return null
  const anyClient = client as any
  const now = nowMs()

  const ts_ms = clampTsMs(typeof input.ts_ms === "number" ? input.ts_ms : now, now)

  const entry: JournalEntryV4 = {
    schema_version: "v4",
    entry_id: entryId,
    kind: input.kind,
    ts_ms,
    logged_ts_ms: now,
    text: typeof input.text === "string" ? input.text : undefined,
    fields: { ...(input.fields ?? {}) } as any,
    revision: 0,
  }

  // Enforce type constraints
  if (entry.kind === "alcohol_urge") {
    delete (entry.fields as any).drinks
  }

  const idx = indexKey(journalId)
  const eKey = entryKey(journalId, entryId)

  await anyClient.set(eKey, JSON.stringify(entry))
  try {
    await anyClient.expire(eKey, JOURNAL_ENTRY_TTL_SECONDS)
  } catch {}

  try {
    await anyClient.zadd(idx, { score: entry.ts_ms, member: entry.entry_id })
  } catch {
    await anyClient.zadd(idx, entry.ts_ms, entry.entry_id)
  }
  try {
    await anyClient.expire(idx, JOURNAL_ENTRY_TTL_SECONDS)
  } catch {}

  return entry
}

export async function getJournalEntry(journalId: string, entryId: string): Promise<JournalEntryV4 | null> {
  const client = getRedisClient()
  if (!client) return null
  const anyClient = client as any
  const raw = await anyClient.get(entryKey(journalId, entryId))
  const parsed = safeJsonParse(raw)
  if (!parsed || typeof parsed !== "object") return null
  return parsed as JournalEntryV4
}

export async function putJournalEntry(journalId: string, entry: JournalEntryV4): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  const anyClient = client as any
  const idx = indexKey(journalId)
  const eKey = entryKey(journalId, entry.entry_id)

  await anyClient.set(eKey, JSON.stringify(entry))
  try {
    await anyClient.expire(eKey, JOURNAL_ENTRY_TTL_SECONDS)
  } catch {}
  try {
    await anyClient.zadd(idx, { score: entry.ts_ms, member: entry.entry_id })
  } catch {
    await anyClient.zadd(idx, entry.ts_ms, entry.entry_id)
  }
  try {
    await anyClient.expire(idx, JOURNAL_ENTRY_TTL_SECONDS)
  } catch {}
}

export async function listJournalEntries(
  journalId: string,
  opts: { limit?: number; fromTsMs?: number; toTsMs?: number; reverse?: boolean } = {}
): Promise<JournalEntryV4[]> {
  const client = getRedisClient()
  if (!client) return []
  const anyClient = client as any

  const idx = indexKey(journalId)
  const limit = typeof opts.limit === "number" ? Math.max(1, Math.min(opts.limit, 500)) : 50
  const reverse = opts.reverse !== false

  let ids: string[] = []
  try {
    if (typeof opts.fromTsMs === "number" || typeof opts.toTsMs === "number") {
      const min = typeof opts.fromTsMs === "number" ? opts.fromTsMs : 0
      const max = typeof opts.toTsMs === "number" ? opts.toTsMs : Date.now()
      if (reverse) {
        // Upstash may not support zrevrangebyscore with offset/count in typed client, use any
        ids = await anyClient.zrevrangebyscore(idx, max, min, { offset: 0, count: limit })
      } else {
        ids = await anyClient.zrangebyscore(idx, min, max, { offset: 0, count: limit })
      }
    } else {
      if (reverse) {
        ids = await anyClient.zrange(idx, 0, limit - 1, { rev: true })
      } else {
        ids = await anyClient.zrange(idx, 0, limit - 1)
      }
    }
  } catch {
    // fallback
    try {
      ids = reverse ? await anyClient.zrevrange(idx, 0, limit - 1) : await anyClient.zrange(idx, 0, limit - 1)
    } catch {
      ids = []
    }
  }

  const entries: JournalEntryV4[] = []
  for (const id of Array.isArray(ids) ? ids : []) {
    const e = await getJournalEntry(journalId, id)
    if (e) entries.push(e)
  }

  // Ensure sorted
  entries.sort((a, b) => (a.ts_ms ?? 0) - (b.ts_ms ?? 0))
  return reverse ? entries.slice(-limit) : entries.slice(0, limit)
}
