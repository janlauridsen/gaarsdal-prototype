// pages/api/sms/stop.ts
// GatewayAPI webhook + manuelt STOP.
// Tilføjer nummeret til STOP-listen og fjerner fra optin+positive.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { normalizePhone, OPTIN_KEY, POSITIVE_KEY, STOPPED_KEY } from "./optin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  // Håndter både direkte kald og GatewayAPI webhook-format
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

  // Fjern fra opt-in liste (scan og slet match)
  for (const key of [OPTIN_KEY, POSITIVE_KEY]) {
    const farFuture = Date.now() + 1000 * 60 * 60 * 24 * 365 * 10
    const all = (await redis.zrange(key, 0, farFuture, { byScore: true, offset: 0, count: 10000 }).catch(() => [])) as string[]
    for (const m of all) {
      try {
        const parsed = JSON.parse(m)
        if (parsed.phone === phone) await redis.zrem(key, m)
      } catch {}
    }
  }

  return res.status(200).json({ ok: true })
}
