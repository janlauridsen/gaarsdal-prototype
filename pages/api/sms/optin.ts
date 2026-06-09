// pages/api/sms/optin.ts
// Gemmer SMS opt-in fra chatbot. Kræver ingen auth.
// Validerer dansk telefonnummer, tjekker STOP-liste.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

export const OPTIN_KEY  = "gaarsdal:sms:optin"
export const STOPPED_KEY = "gaarsdal:sms:stopped"
export const POSITIVE_KEY = "gaarsdal:sms:positive"
export const SENT_KEY    = "gaarsdal:sms:sent"

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-]/g, "").replace(/^\+45/, "").replace(/^0045/, "")
  const match = digits.match(/^([0-9]{8})$/)
  if (!match) return null
  return `+45${match[1]}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const { phone, source, sid, chatbotType } = req.body ?? {}
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ error: "Mangler telefonnummer" })
  }

  const normalized = normalizePhone(phone)
  if (!normalized) {
    return res.status(400).json({ error: "Ugyldigt dansk telefonnummer (8 cifre)" })
  }

  const redis = getRedisClient()
  if (!redis) return res.status(500).json({ error: "Ingen Redis" })

  // Tjek STOP-liste — respektér altid
  const stopped = await redis.sismember(STOPPED_KEY, normalized).catch(() => 0)
  if (stopped) return res.status(200).json({ ok: false, reason: "stopped" })

  const now = Date.now()
  const record = JSON.stringify({
    phone: normalized,
    source: source ?? "chatbot",
    sid: sid ?? "",
    chatbotType: chatbotType ?? "standard",
    ts: new Date(now).toISOString(),
    day: new Date(now).toISOString().slice(0, 10),
  })

  // nx = gem kun hvis ikke allerede eksisterer (samme score = ingen dubletter)
  await redis.zadd(OPTIN_KEY, { score: now, member: record }).catch(() => null)

  return res.status(200).json({ ok: true, phone: normalized })
}
