// pages/api/admin/memory.ts
//
// Viser hukommelse og tråd-genbrug for alle brugere i systemet.
// Returnerer profil, episoder, og scan_threads drafts.
//
// GET /api/admin/memory?secret=<ADMIN_SECRET>&user_key=<optional>

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const THREADS_PREFIX = "gaarsdal:threads:u:"
const PROFILE_PREFIX = "gaarsdal:profile:"
const MEM_PREFIX = "gaarsdal:mem:v23:u:"
const DRAFT_LATEST_PREFIX = "gaarsdal:jobs:v1:draft:latest:conversation:"
const DRAFT_PREFIX = "gaarsdal:jobs:v1:draft:conversation:"

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  const provided = typeof req.query.secret === "string" ? req.query.secret : ""
  return !secret || provided === secret
}

type EpisodeSummary = {
  episode_id: string
  summary_short: string
  open_loops: string[]
  started_at: number
  updated_at: number
}

type ThreadInfo = {
  conversation_id: string
  title: string
  preview: string
  updated_at: string
  episode_summary: EpisodeSummary | null
  latest_draft: {
    summary_draft: string
    open_questions: string[]
    created_at: number
  } | null
}

type UserMemory = {
  user_key: string
  profile: {
    last_seen_at: string
    last_node: string
    node_counts: Record<string, number>
    topics: string[]
    topic_scores: Record<string, number>
  } | null
  threads: ThreadInfo[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" })

  const client = getRedisClient()
  const filterUserKey = typeof req.query.user_key === "string" ? req.query.user_key : null

  try {
    // Find alle bruger-nøgler via SCAN på threads-keys
    let userKeys: string[] = []
    if (filterUserKey) {
      userKeys = [filterUserKey]
    } else {
      let cursor: string | number = "0"
      do {
        const result = await (client as any).scan(cursor, { match: `${THREADS_PREFIX}*`, count: 100 })
        cursor = String(result[0])
        const keys: string[] = result[1]
        userKeys.push(...keys.map((k: string) => k.replace(THREADS_PREFIX, "")))
      } while (cursor !== "0")
      userKeys = userKeys.slice(0, 20) // max 20 brugere ad gangen
    }

    const users: UserMemory[] = []

    for (const userKey of userKeys) {
      // Profil
      const profileRaw = await client.get(`${PROFILE_PREFIX}${userKey}`)
      let profile: UserMemory["profile"] = null
      if (profileRaw) {
        try {
          const p = typeof profileRaw === "string" ? JSON.parse(profileRaw) : profileRaw as any
          profile = {
            last_seen_at: p.last_seen_at ?? "",
            last_node: p.last_node ?? "",
            node_counts: p.node_counts ?? {},
            topics: p.core?.semantic?.topics ?? [],
            topic_scores: p.topic_scores ?? {},
          }
        } catch {}
      }

      // Tråde
      const threadsRaw = await client.get(`${THREADS_PREFIX}${userKey}`)
      const threadList: Array<{ conversation_id: string; title: string; preview: string; updated_at: string }> = []
      if (threadsRaw) {
        try {
          const t = typeof threadsRaw === "string" ? JSON.parse(threadsRaw) : threadsRaw as any
          for (const th of t.threads ?? []) {
            threadList.push({
              conversation_id: th.conversation_id,
              title: th.title ?? "Ny samtale",
              preview: th.preview ?? "",
              updated_at: th.updated_at ?? "",
            })
          }
        } catch {}
      }

      // Byg thread info med episode summaries og drafts
      const threads: ThreadInfo[] = []
      for (const th of threadList.slice(0, 10)) {
        const convId = th.conversation_id

        // Episode summary
        let episodeSummary: EpisodeSummary | null = null
        const episodeKey = `${MEM_PREFIX}${userKey}:episode:episode:thread:${convId}:1`
        const episodeRaw = await client.get(episodeKey)
        if (episodeRaw) {
          try {
            const e = typeof episodeRaw === "string" ? JSON.parse(episodeRaw) : episodeRaw as any
            episodeSummary = {
              episode_id: e.episode_id ?? "",
              summary_short: e.summary_short ?? "",
              open_loops: e.open_loops ?? [],
              started_at: e.started_at ?? 0,
              updated_at: e.updated_at ?? 0,
            }
          } catch {}
        }

        // Latest scan_threads draft
        let latestDraft: ThreadInfo["latest_draft"] = null
        const latestJobIdRaw = await client.get(`${DRAFT_LATEST_PREFIX}${convId}`)
        if (latestJobIdRaw) {
          const jobId = typeof latestJobIdRaw === "string" ? latestJobIdRaw : String(latestJobIdRaw)
          const draftKey = `${DRAFT_PREFIX}${convId}:${jobId}`
          const draftRaw = await client.get(draftKey)
          if (draftRaw) {
            try {
              const d = typeof draftRaw === "string" ? JSON.parse(draftRaw) : draftRaw as any
              latestDraft = {
                summary_draft: d.summary_draft ?? "",
                open_questions: d.open_questions ?? [],
                created_at: d.created_at ?? 0,
              }
            } catch {}
          }
        }

        threads.push({
          ...th,
          episode_summary: episodeSummary,
          latest_draft: latestDraft,
        })
      }

      users.push({ user_key: userKey, profile, threads })
    }

    return res.status(200).json({ users, fetched_at: new Date().toISOString() })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
}
