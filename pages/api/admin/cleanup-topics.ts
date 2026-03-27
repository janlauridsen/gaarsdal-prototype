// pages/api/admin/cleanup-topics.ts
//
// Renser junk-keys fra profile.topic_scores og profile.core.semantic.topics.
// Junk-keys er sætningsformede strenge der stammer fra signals (nu rettet).
//
// POST /api/admin/cleanup-topics?secret=<ADMIN_SECRET>
//   body: { user_key?: string }  — udelad for at køre på ALLE brugere
//
// DRY RUN: GET-kald viser hvad der ville blive fjernet uden at skrive.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const PROFILE_PREFIX = "gaarsdal:profile:"

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  const provided = typeof req.query.secret === "string" ? req.query.secret : ""
  return !secret || provided === secret
}

// En topic-key er junk hvis den:
// - Er mere end 4 ord (sætningsformet)
// - Er præcis "llm_fallback"
// - Er en kendt signal-streng
function isJunkTopic(key: string): boolean {
  if (key === "llm_fallback") return true
  const wordCount = key.trim().split(/\s+/).length
  if (wordCount > 4) return true
  return false
}

async function cleanProfile(redis: any, userKey: string, dryRun: boolean): Promise<{
  userKey: string
  removed: string[]
  kept: string[]
  written: boolean
}> {
  const profileKey = `${PROFILE_PREFIX}${userKey}`
  const raw = await redis.get(profileKey)
  if (!raw) return { userKey, removed: [], kept: [], written: false }

  const profile = typeof raw === "string" ? JSON.parse(raw) : raw

  const topicScores: Record<string, number> = profile.topic_scores ?? {}
  const semanticTopics: string[] = profile.core?.semantic?.topics ?? []

  const removed: string[] = []
  const keptScores: Record<string, number> = {}

  for (const [key, score] of Object.entries(topicScores)) {
    if (isJunkTopic(key)) {
      removed.push(key)
    } else {
      keptScores[key] = score as number
    }
  }

  const keptTopics = semanticTopics.filter((t) => !isJunkTopic(t))

  if (removed.length === 0) {
    return { userKey, removed: [], kept: Object.keys(keptScores), written: false }
  }

  if (!dryRun) {
    const updated = {
      ...profile,
      topic_scores: keptScores,
      core: {
        ...profile.core,
        semantic: {
          ...profile.core?.semantic,
          topics: keptTopics,
        },
      },
    }
    await redis.set(profileKey, JSON.stringify(updated), { ex: 7776000 })
  }

  return { userKey, removed, kept: Object.keys(keptScores), written: !dryRun }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" })

  const dryRun = req.method === "GET"
  const redis = getRedisClient()

  try {
    let userKeys: string[] = []

    if (req.method === "POST" && req.body?.user_key) {
      userKeys = [req.body.user_key]
    } else {
      // Find alle profiler
      const keys = await redis.keys(`${PROFILE_PREFIX}*`)
      userKeys = keys.map((k: string) => k.replace(PROFILE_PREFIX, ""))
    }

    const results = await Promise.all(
      userKeys.map((uk) => cleanProfile(redis, uk, dryRun))
    )

    const touched = results.filter((r) => r.removed.length > 0)

    return res.status(200).json({
      dry_run: dryRun,
      users_scanned: userKeys.length,
      users_affected: touched.length,
      results: touched,
    })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
