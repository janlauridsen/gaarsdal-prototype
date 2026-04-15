// pages/api/admin/states.ts
//
// Batch-henter conversation states for admin-visning.
// Returnerer relevante meta-felter: fit, arousal, problem-titel, topic-tags.
//
// POST /api/admin/states
// Body: { secret: string, conversation_ids: string[] }

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const STATE_KEY_PREFIX = "gaarsdal:state:"

type StateSummary = {
  conversation_id: string
  fit?: "good" | "explore" | "unknown"
  fit_reason?: string
  arousal_level?: string
  arousal_score?: number
  problem_title?: string
  topic_tags?: string[]
  active_node?: string
  status?: string
  genHypnoTranscript?: Array<{ role: string; content: string }>
}

function extractMeta(raw: unknown): StateSummary | null {
  let state: any
  if (typeof raw === "string") {
    try { state = JSON.parse(raw) } catch { return null }
  } else if (raw && typeof raw === "object\") {
    state = raw
  } else {
    return null
  }

  if (!state?.conversation_id || !state?.meta) return null

  const m = state.meta
  const g = (key: string) => m[key]?.value

  const rawTranscript = g("gen_hypno.transcript")
  const genHypnoTranscript: Array<{ role: string; content: string }> | undefined =
    Array.isArray(rawTranscript)
      ? rawTranscript.filter((t: any) => t?.role && t?.content)
      : undefined

  return {
    conversation_id: state.conversation_id,
    fit: g("prequalify.fit"),
    fit_reason: g("prequalify.reason"),
    arousal_level: g("wot.arousal_level"),
    arousal_score: typeof g("wot.arousal_score") === "number" ? g("wot.arousal_score") : undefined,
    problem_title: g("gen_hypno.problem_title"),
    topic_tags: Array.isArray(g("gen_hypno.topic_tags")) ? g("gen_hypno.topic_tags") : undefined,
    active_node: state.active_node,
    status: state.status,
    genHypnoTranscript,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret" })

  const { secret, conversation_ids } = req.body ?? {}
  if (secret !== adminSecret) return res.status(401).json({ error: "Ugyldig secret" })
  if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
    return res.status(400).json({ error: "Mangler conversation_ids" })
  }

  const redis = getRedisClient()
  if (!redis) return res.status(503).json({ error: "Redis ikke tilgængelig" })

  const ids = (conversation_ids as unknown[]).filter((id): id is string => typeof id === "string").slice(0, 200)

  const results: StateSummary[] = []
  for (const id of ids) {
    try {
      const raw = await redis.get<unknown>(`${STATE_KEY_PREFIX}${id}`)
      const summary = raw ? extractMeta(raw) : null
      if (summary) results.push(summary)
    } catch {
      // skip
    }
  }

  return res.status(200).json({ states: results })
}
