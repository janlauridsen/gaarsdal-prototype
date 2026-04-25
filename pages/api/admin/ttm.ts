// pages/api/admin/ttm.ts
// Henter TTM-samtaler til admin-siden.
// Læser fra gaarsdal:ttm:index (sorted set) og gaarsdal:state:ttm:* (states).

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const TTM_INDEX_KEY = "gaarsdal:ttm:index"
const TTM_STATE_PREFIX = "gaarsdal:state:ttm:"

export type TtmConversation = {
  conversation_id: string
  started_at: string
  turn_count: number
  score: number | null
  last_topic: string | null
  ritual_stage: string
  transcript: Array<{ role: "user" | "assistant"; content: string }>
}

function validateToken(req: NextApiRequest, res: NextApiResponse): boolean {
  const secret = req.query.secret ?? req.body?.secret
  const expected = process.env.ADMIN_TOKEN
  if (!expected || secret !== expected) {
    res.status(401).json({ error: "Unauthorized" })
    return false
  }
  return true
}

function parseDate(s: string, endOfDay = false): number {
  const d = new Date(s)
  if (isNaN(d.getTime())) throw new Error(`Ugyldig dato: ${s}`)
  if (endOfDay) { d.setHours(23, 59, 59, 999) }
  else { d.setHours(0, 0, 0, 0) }
  return d.getTime()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateToken(req, res)) return

  // ── DELETE: slet én TTM-samtale ─────────────────────────────────────────
  if (req.method === "DELETE") {
    const conversationId = typeof req.body?.conversation_id === "string" ? req.body.conversation_id.trim() : ""
    if (!conversationId.startsWith("ttm:")) {
      res.status(400).json({ error: "Ugyldigt conversation_id" })
      return
    }

    const client = getRedisClient()
    if (!client) {
      res.status(500).json({ error: "Redis ikke tilgængeligt" })
      return
    }

    const shortId = conversationId.replace(/^ttm:/, "")
    try {
      await Promise.all([
        client.del(`${TTM_STATE_PREFIX}${shortId}`),
        client.zrem(TTM_INDEX_KEY, shortId),
      ])
      res.status(200).json({ deleted: conversationId })
    } catch (err) {
      console.error("[TTM admin DELETE]", err)
      res.status(500).json({ error: String(err) })
    }
    return
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const client = getRedisClient()
  if (!client) {
    res.status(500).json({ error: "Redis ikke tilgængeligt" })
    return
  }

  try {
    const fromStr = typeof req.query.from === "string" ? req.query.from : new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const toStr = typeof req.query.to === "string" ? req.query.to : new Date().toISOString().slice(0, 10)
    const fromMs = parseDate(fromStr, false)
    const toMs = parseDate(toStr, true)
    const limit = Math.min(parseInt(String(req.query.limit ?? "200"), 10), 500)

    // Hent conversation IDs fra TTM-index inden for dato-range
    const entries = await client.zrange(
      TTM_INDEX_KEY,
      fromMs,
      toMs,
      { byScore: true, offset: 0, count: limit }
    ) as string[]

    if (!entries || entries.length === 0) {
      res.status(200).json({ conversations: [], from: fromStr, to: toStr, total: 0 })
      return
    }

    // Hent states parallelt
    const statePromises = entries.map((id) =>
      client.get<unknown>(`${TTM_STATE_PREFIX}${id.replace(/^ttm:/, "")}`)
    )
    const rawStates = await Promise.all(statePromises)

    const conversations: TtmConversation[] = []

    for (let i = 0; i < entries.length; i++) {
      const raw = rawStates[i]
      if (!raw) continue

      let state: any
      try {
        state = typeof raw === "string" ? JSON.parse(raw) : raw
      } catch {
        continue
      }

      const meta = state?.meta ?? {}
      const transcript = meta["ttm.transcript"]?.value
      const score = meta["ttm.score"]?.value
      const lastTopic = meta["ttm.last_topic"]?.value
      const ritualStage = meta["ttm.ritual_stage"]?.value ?? "q1"
      const turnCount = meta["ttm.turn_count"]?.value ?? 0

      // Find started_at fra første transcript-entry eller brug index-score
      const firstTs = Array.isArray(transcript) && transcript.length > 0
        ? (transcript[0] as any)?.ts ?? null
        : null

      conversations.push({
        conversation_id: state.conversation_id ?? entries[i],
        started_at: firstTs ?? new Date(fromMs).toISOString(),
        turn_count: typeof turnCount === "number" ? turnCount : 0,
        score: typeof score === "number" ? score : null,
        last_topic: typeof lastTopic === "string" && lastTopic ? lastTopic : null,
        ritual_stage: typeof ritualStage === "string" ? ritualStage : "q1",
        transcript: Array.isArray(transcript)
          ? transcript.filter((t: any) =>
              t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string"
            )
          : [],
      })
    }

    // Nyeste først
    conversations.sort((a, b) => b.turn_count - a.turn_count)

    res.status(200).json({
      conversations,
      from: fromStr,
      to: toStr,
      total: conversations.length,
    })
  } catch (err) {
    console.error("[TTM admin]", err)
    res.status(500).json({ error: String(err) })
  }
}
