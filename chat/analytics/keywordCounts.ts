// chat/analytics/keywordCounts.ts
//
// Anonymiseret aggregering af emne-keywords fra chatsamtaler.
// Gemmer daglige counts i Redis-hash: gaarsdal:keywords:YYYY-MM-DD
// Ingen session-ID eller bruger-link — kun rå frekvenser.
// GDPR: aggregeret statistik er ikke persondata.

import { getRedisClient } from "../persistence/redis"

const TTL_SECONDS = 366 * 24 * 60 * 60

function todayKey(): string {
  return "gaarsdal:keywords:" + new Date().toISOString().slice(0, 10)
}

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().slice(0, 50)
}

export async function incrementKeywordCounts(tags: string[]): Promise<void> {
  const cleaned = tags.map(normalizeTag).filter(Boolean)
  if (!cleaned.length) return
  const redis = getRedisClient()
  if (!redis) return
  const key = todayKey()
  try {
    await Promise.all(cleaned.map(tag => redis.hincrby(key, tag, 1)))
    await redis.expire(key, TTL_SECONDS)
  } catch {}
}
