// pages/api/admin/hits.ts
//
// Returnerer page hits til admin-visning.
// GET /api/admin/hits?secret=<ADMIN_SECRET>&days=30

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const HITS_KEY = "gaarsdal:hits:v2"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret" })
  if (req.query.secret !== adminSecret) return res.status(401).json({ error: "Ugyldig secret" })

  const days = Math.min(Number(req.query.days ?? 30), 365)
  const now = Date.now()
  const fromScore = now - days * 24 * 60 * 60 * 1000

  const redis = getRedisClient()
  if (!redis) return res.status(503).json({ error: "Redis ikke tilgængelig" })

  // Hent hits inden for tidsvinduet fra sorted set
  const raw = await redis.zrange(HITS_KEY, fromScore, now, { byScore: true }) as string[]

  const hits = raw
    .map(h => { try { return JSON.parse(h) } catch { return null } })
    .filter(Boolean)

  return res.status(200).json({ hits, total: hits.length, days })
}
