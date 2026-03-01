import { getRedisClient } from "./redis"

const DEF_PREFIX = "gaarsdal:journal:def:"
const USER_INDEX_PREFIX = "gaarsdal:journal:index:user:"

export const JOURNAL_DEF_TTL_SECONDS = 365 * 24 * 60 * 60 // 12 months

function defKey(journalId: string): string {
  return `${DEF_PREFIX}${journalId}`
}

function userIndexKey(userId: string): string {
  return `${USER_INDEX_PREFIX}${userId}`
}

export type JournalDefinition = {
  journal_id: string
  profile_type: string
  title?: string
  problem?: string
  goal?: string
  schema_version: string
  fields_definition?: any
  plan?: any
  created_at_ms: number
  updated_at_ms: number
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

/**
 * Upsert journal definition + index by user.
 * This is used for:
 * - listing journals per user
 * - export authorization
 * - long-term retention independent of conversation state
 */
export async function writeJournalDefinition(userId: string, def: JournalDefinition): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  const anyClient = client as any

  await anyClient.set(defKey(def.journal_id), JSON.stringify(def), { ex: JOURNAL_DEF_TTL_SECONDS })

  try {
    await anyClient.sadd(userIndexKey(userId), def.journal_id)
    await anyClient.expire(userIndexKey(userId), JOURNAL_DEF_TTL_SECONDS)
  } catch {
    // ignore
  }
}

export async function readJournalDefinition(journalId: string): Promise<JournalDefinition | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await (client as any).get(defKey(journalId))
  const parsed = safeParseJson(raw)
  if (!parsed || typeof parsed !== "object") return null
  return parsed as JournalDefinition
}

export async function listUserJournalIds(userId: string): Promise<string[]> {
  const client = getRedisClient()
  if (!client) return []
  try {
    const res = await (client as any).smembers(userIndexKey(userId))
    return Array.isArray(res) ? res.map(String) : []
  } catch {
    return []
  }
}
