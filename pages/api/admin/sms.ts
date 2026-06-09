// pages/api/admin/sms.ts

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { OPTIN_KEY, POSITIVE_KEY, STOPPED_KEY, SENT_KEY, normalizePhone } from "../sms/optin"

function parseMembers(raw: unknown): any[] {
  if (!Array.isArray(raw)) return []
  return raw
    .reverse()
    .map(m => {
      try { return JSON.parse(String(m)) } catch { return null }
    })
    .filter(Boolean)
}

async function safeZrange(redis: any, key: string): Promise<string[]> {
  try {
    const result = await redis.zrange(key, 0, -1)
    return Array.isArray(result) ? result.map(String) : []
  } catch {
    return []
  }
}

async function safeSmembers(redis: any, key: string): Promise<string[]> {
  try {
    const result = await redis.smembers(key)
    return Array.isArray(result) ? result.map(String) : []
  } catch {
    return []
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"] ?? req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const redis = getRedisClient()
  if (!redis) return res.status(500).json({ error: "Ingen Redis" })

  if (req.method === "GET") {
    const [optinRaw, positiveRaw, stopped, sentRaw] = await Promise.all([
      safeZrange(redis, OPTIN_KEY),
      safeZrange(redis, POSITIVE_KEY),
      safeSmembers(redis, STOPPED_KEY),
      safeZrange(redis, SENT_KEY),
    ])

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res.status(200).json({
      optin: parseMembers(optinRaw),
      positive: parseMembers(positiveRaw),
      stopped,
      sent: parseMembers(sentRaw).slice(0, 20),
    })
  }

  if (req.method === "POST") {
    const { action, phone, note } = req.body ?? {}
    const normalized = phone ? normalizePhone(phone) : null
    if (!normalized) return res.status(400).json({ error: "Ugyldigt nummer" })

    if (action === "add_positive") {
      const now = Date.now()
      const record = JSON.stringify({
        phone: normalized,
        note: note ?? "",
        ts: new Date(now).toISOString(),
        day: new Date(now).toISOString().slice(0, 10),
      })
      await redis.zadd(POSITIVE_KEY, { score: now, member: record })
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res.status(200).json({ ok: true })
    }

    if (action === "remove_positive" || action === "remove_optin") {
      const key = action === "remove_positive" ? POSITIVE_KEY : OPTIN_KEY
      const all = await safeZrange(redis, key)
      for (const m of all) {
        try {
          if (JSON.parse(m).phone === normalized) await redis.zrem(key, m)
        } catch {}
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res.status(200).json({ ok: true })
    }
  }

  return res.status(405).end()
}
