// pages/api/sms/stop.ts
// GatewayAPI webhook + manuelt STOP.
// Tilføjer nummeret til STOP-listen og fjerner fra optin+positive.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { normalizePhone, OPTIN_KEY, POSITIVE_KEY, STOPPED_KEY } from "./optin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const rawPhone = req.body?.phone ?? req.body?.msisdn ?? req.body?.number ?? ""
  const phone = typeof rawPhone === "string" ? normalizePhone(rawPhone) : null
  if (!phone) return res.status(400).json({ error: "Ugyldigt nummer" })

  const redis = getRedisClient()
  if (!redis) return res.status(500).end()

  await redis.sadd(STOPPED_KEY, phone).catch(() => null)

  // Fjern fra opt-in liste (scan og slet match)
  for (const key of [OPTIN_KEY, POSITIVE_KEY]) {
    const all = (await redis.zrange(key, 0, -1).catch(() => [] as string[])) as string[]
    for (const m of all) {
      try {
        const parsed = JSON.parse(m)
        if (parsed.phone === phone) await redis.zrem(key, m)
      } catch {}
    }
  }

  return res.status(200).json({ ok: true })
}
