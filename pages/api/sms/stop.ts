// pages/api/sms/stop.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { normalizePhone, OPTIN_KEY, POSITIVE_KEY, STOPPED_KEY } from "./optin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const body = req.body ?? {}
  const rawPhone =
    body.phone ??
    body.msisdn ??
    body.number ??
    body.event?.recipient?.toString() ??
    body.event?.msisdn?.toString() ??
    ""
  const phone = typeof rawPhone === "string" ? normalizePhone(rawPhone) : null
  if (!phone) return res.status(200).json({ ok: false, reason: "no phone extracted" })

  const redis = getRedisClient()
  if (!redis) return res.status(500).end()

  await redis.sadd(STOPPED_KEY, phone).catch(() => null)

  // Brug zrange(0,-1) - samme som admin/sms.ts der virker
  // Upstash returnerer parsede objekter ved rank-baseret zrange
  for (const key of [OPTIN_KEY, POSITIVE_KEY]) {
    try {
      const all = (await redis.zrange(key, 0, -1)) as any[]
      for (const m of all) {
        try {
          const obj = typeof m === "string" ? JSON.parse(m) : m
          if (obj?.phone === phone) {
            await redis.zrem(key, m)
          }
        } catch {}
      }
    } catch {}
  }

  return res.status(200).json({ ok: true })
}
