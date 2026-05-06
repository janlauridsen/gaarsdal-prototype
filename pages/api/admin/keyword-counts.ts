// pages/api/admin/keyword-counts.ts
//
// Returnerer daglige keyword-counts til admin Traffic-tab.
// GET /api/admin/keyword-counts?secret=<ADMIN_TOKEN>&days=30

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end()
  const token = process.env.ADMIN_TOKEN
  if (!token) return res.status(503).json({ error: "ADMIN_TOKEN ikke konfigureret" })
  if (req.query.secret !== token) return res.status(401).json({ error: "Ugyldig secret" })

  const days = Math.min(Number(req.query.days ?? 30), 365)
  const redis = getRedisClient()
  if (!redis) return res.status(503).json({ error: "Redis ikke tilgængelig" })

  const result: Array<{ day: string; keywords: Record<string, number> }> = []

  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 86400000)
    const day = d.toISOString().slice(0, 10)
    const key = "gaarsdal:keywords:" + day
    try {
      const raw = await redis.hgetall(key) as Record<string, string> | null
      if (raw && Object.keys(raw).length > 0) {
        const keywords: Record<string, number> = {}
        for (const [k, v] of Object.entries(raw)) keywords[k] = Number(v)
        result.push({ day, keywords })
      }
    } catch {}
  }

  return res.status(200).json({ days: result })
}
