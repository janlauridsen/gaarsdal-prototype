// pages/api/admin/sms.ts
// Henter opt-in, positive og STOP-lister til admin.
// POST: tilføj/fjern fra positiv liste.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { OPTIN_KEY, POSITIVE_KEY, STOPPED_KEY, SENT_KEY, normalizePhone } from "../sms/optin"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"] ?? req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const redis = getRedisClient()
  if (!redis) return res.status(500).end()

  if (req.method === "GET") {
    const [optinRaw, positiveRaw, stopped, sentRaw] = await Promise.all([
      redis.zrange(OPTIN_KEY, 0, -1, { rev: true }).catch(() => [] as string[]),
      redis.zrange(POSITIVE_KEY, 0, -1, { rev: true }).catch(() => [] as string[]),
      redis.smembers(STOPPED_KEY).catch(() => [] as string[]),
      redis.zrange(SENT_KEY, 0, -1, { rev: true }).catch(() => [] as string[]),
    ]) as [string[], string[], string[], string[]]
    const parse = (arr: string[]) => arr.map(m => { try { return JSON.parse(m) } catch { return null } }).filter(Boolean)
    return res.status(200).json({
      optin: parse(optinRaw),
      positive: parse(positiveRaw),
      stopped,
      sent: parse(sentRaw).slice(0, 20),
    })
  }

  if (req.method === "POST") {
    const { action, phone, note } = req.body ?? {}
    const normalized = phone ? normalizePhone(phone) : null
    if (!normalized) return res.status(400).json({ error: "Ugyldigt nummer" })

    if (action === "add_positive") {
      const now = Date.now()
      const record = JSON.stringify({ phone: normalized, note: note ?? "", ts: new Date(now).toISOString(), day: new Date(now).toISOString().slice(0,10) })
      await redis.zadd(POSITIVE_KEY, { score: now, member: record })
      return res.status(200).json({ ok: true })
    }
    if (action === "remove_positive") {
      const all = (await redis.zrange(POSITIVE_KEY, 0, -1).catch(() => [] as string[])) as string[]
      for (const m of all) {
        try { if (JSON.parse(m).phone === normalized) await redis.zrem(POSITIVE_KEY, m) } catch {}
      }
      return res.status(200).json({ ok: true })
    }
    if (action === "remove_optin") {
      const all = (await redis.zrange(OPTIN_KEY, 0, -1).catch(() => [] as string[])) as string[]
      for (const m of all) {
        try { if (JSON.parse(m).phone === normalized) await redis.zrem(OPTIN_KEY, m) } catch {}
      }
      return res.status(200).json({ ok: true })
    }
  }

  return res.status(405).end()
}
