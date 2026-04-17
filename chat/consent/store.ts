// chat/consent/store.ts
import { getRedisClient } from "../persistence/redis"
import { readThreadIndex } from "../persistence/threadIndexStore"

export type ConsentRetentionDays = 0 | 7 | 30 | 90 | 365

export type ConsentRecord = {
  version: 1
  allowed: boolean
  retentionDays: ConsentRetentionDays
  consentedAt: string
}

// TTL for the consent record itself — outlives any retention period
const CONSENT_RECORD_TTL = 400 * 24 * 60 * 60 // 400 days

// Short TTL used when retention is "session only" (retentionDays === 0)
export const SESSION_ONLY_TTL_SECONDS = 2 * 60 * 60 // 2 hours

function consentKey(userKey: string): string {
  return `gaarsdal:consent:u:${userKey}`
}

function isValidConsentRecord(v: unknown): v is ConsentRecord {
  if (typeof v !== "object" || v === null) return false
  const r = v as any
  return (
    r.version === 1 &&
    typeof r.allowed === "boolean" &&
    [0, 7, 30, 90, 365].includes(r.retentionDays) &&
    typeof r.consentedAt === "string"
  )
}

export async function readConsent(userKey: string): Promise<ConsentRecord | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const raw = await client.get<unknown>(consentKey(userKey))
    if (!raw) return null

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    return isValidConsentRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function writeConsent(
  userKey: string,
  record: ConsentRecord
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const ttl = record.retentionDays === 0 ? SESSION_ONLY_TTL_SECONDS : CONSENT_RECORD_TTL

  await client.set(consentKey(userKey), JSON.stringify(record), {
    ex: ttl,
  })
}

/**
 * Returnerer antal sekunder der skal bruges som Redis TTL baseret på samtykke.
 * retentionDays === 0 → session-only (2 timer)
 * retentionDays > 0   → fuldt TTL i dage
 */
export function consentTtlSeconds(record: ConsentRecord | null): number {
  if (!record || record.retentionDays === 0) return SESSION_ONLY_TTL_SECONDS
  return record.retentionDays * 24 * 60 * 60
}

/**
 * Returnerer true hvis samtykke er givet og data må gemmes permanent.
 * Session-only (retentionDays === 0) og ingen samtykke giver begge false.
 */
export function consentAllowsPersistence(record: ConsentRecord | null): boolean {
  return !!(record?.allowed && (record.retentionDays ?? 0) > 0)
}

/**
 * Sletter alle Redis-keys for en given bruger.
 * Bruges ved "Slet mine data"-handlingen.
 *
 * Strategi:
 * 1. Læs thread-index for at finde alle conversation IDs
 * 2. Slet alle kendte keys for bruger + samtaler
 * 3. Scan efter long-term memory keys (tema/episode/fakta)
 */
export async function deleteAllUserData(
  userKey: string
): Promise<{ deletedCount: number }> {
  const client = getRedisClient()
  if (!client) return { deletedCount: 0 }

  // Hent alle samtale-ID'er fra thread-index (hvis det eksisterer)
  let conversationIds: string[] = []
  try {
    const index = await readThreadIndex(userKey)
    conversationIds = index?.threads.map((t) => t.conversation_id) ?? []
  } catch {
    // Fortsæt uden thread-index — vi sletter stadig alt vi kan
  }

  const lobbyId = `lobby:u:${userKey}`
  const allConvIds = [lobbyId, ...conversationIds]

  const knownKeys: string[] = [
    consentKey(userKey),
    `gaarsdal:threads:u:${userKey}`,
    `gaarsdal:profile:${userKey}`,
    `gaarsdal:memory:events:${userKey}`,
    `gaarsdal:events:v1:u:${userKey}`,
    // Per-samtale keys
    ...allConvIds.flatMap((id) => [
      `gaarsdal:state:${id}`,
      `gaarsdal:raw:conversation:${id}`,
      `gaarsdal:events:v1:conv:${id}`,
      `gaarsdal:conv:last_turn_at:${id}`,
    ]),
  ]

  // Scan efter long-term memory keys (tema/episode/fakta-strukturer)
  let memoryKeys: string[] = []
  try {
    memoryKeys = await client.keys(`gaarsdal:mem:v23:u:${userKey}:*`)
  } catch {
    // Non-fatal — de kendte keys slettes stadig
  }

  // Scan efter job-nøgler (indeholder transcript-uddrag i payload)
  let jobKeys: string[] = []
  try {
    jobKeys = await client.keys(`gaarsdal:jobs:v1:job:*`)
    // Filtrer til kun denne brugers jobs — ingen bruger-prefix i nøglen,
    // så vi scanner og filtrerer på user_key i værdien er ikke muligt effektivt.
    // Brug i stedet dedupe-nøgler som har conversation-id i sig:
    const dedupeKeys = await client.keys(`gaarsdal:jobs:v1:dedupe:conversation:*`)
    const pendingKeys = allConvIds.map(id => `gaarsdal:jobs:v1:pending:conversation:${id}`)
    jobKeys = [...dedupeKeys, ...pendingKeys]
  } catch {
    // Non-fatal
  }

  const allKeys = [...new Set([...knownKeys, ...memoryKeys, ...jobKeys])].filter(Boolean)
  if (allKeys.length === 0) return { deletedCount: 0 }

  try {
    const deletedCount = await client.del(...(allKeys as [string, ...string[]]))
    return { deletedCount: deletedCount ?? 0 }
  } catch {
    return { deletedCount: 0 }
  }
}
