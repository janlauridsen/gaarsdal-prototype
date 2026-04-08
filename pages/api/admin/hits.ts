// pages/api/admin/hits.ts
//
// Returnerer page hits til admin-visning.
// GET /api/admin/hits?secret=<ADMIN_SECRET>&days=30

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const HITS_KEY = "gaarsdal:hits:v1"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret" })
  if (req.query.secret !== adminSecret) return res.status(401).json({ error: "Ugyldig secret" })

  const days = Math.min(Number(req.query.days ?? 30), 90)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const redis = getRedisClient()
  if (!redis) return res.status(503).json({ error: "Redis ikke tilgængelig" })

  const raw = await redis.lrange(HITS_KEY, 0, 4999) as unknown[]
  const hits = raw
    .map(h => {
      try { return typeof h === "string" ? JSON.parse(h) : h } catch { return null }
    })
    .filter(h => h && h.day >= cutoffStr)

  return res.status(200).json({ hits, total: hits.length, days })
}
