// pages/api/sms/optin.ts
// Gemmer SMS opt-in fra chatbot. Kræver ingen auth.
// Validerer dansk telefonnummer, tjekker STOP-liste.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

export const OPTIN_KEY  = "gaarsdal:sms:optin"
export const STOPPED_KEY = "gaarsdal:sms:stopped"
export const POSITIVE_KEY = "gaarsdal:sms:positive"
export const SENT_KEY    = "gaarsdal:sms:sent"

/**
 * Zset-medlemmer kan komme tilbage fra Upstash enten som rå JSON-streng eller som
 * færdig-deserialiseret objekt, afhængigt af klientens auto-deserialisering.
 * Alt der læser medlemmer skal gå gennem denne — ellers fejler JSON.parse på et
 * objekt og bliver slugt af et tomt catch.
 */
export function phoneOf(member: unknown): string | null {
  if (member == null) return null
  if (typeof member === "object") {
    const p = (member as { phone?: unknown }).phone
    return typeof p === "string" ? p : null
  }
  if (typeof member === "string") {
    try {
      const p = JSON.parse(member)?.phone
      return typeof p === "string" ? p : null
    } catch {
      return null
    }
  }
  return null
}

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

  // Hvis aktivt tilmelder sig igen, fjern fra STOP-liste (nyt eksplicit samtykke)
  const stopped = await redis.sismember(STOPPED_KEY, normalized).catch(() => 0)
  if (stopped) {
    await redis.srem(STOPPED_KEY, normalized).catch(() => null)
  }

  const now = Date.now()
  const record = JSON.stringify({
    phone: normalized,
    source: source ?? "chatbot",
    sid: sid ?? "",
    chatbotType: chatbotType ?? "standard",
    ts: new Date(now).toISOString(),
    day: new Date(now).toISOString().slice(0, 10),
  })

  // Dedup på telefonnummer.
  // Tidligere kommentar lovede "nx = ingen dubletter", men zadd blev kaldt uden nx,
  // og medlemsstrengen indeholder ts/day — så hver tilmelding gav en ny række.
  // Resultat: samme nummer optrådte flere gange i admin og ville modtage flere SMS.
  // Ældre rækker for samme nummer fjernes, så den nyeste (= gældende) samtykkedato står tilbage.
  const existing = await redis.zrange(OPTIN_KEY, 0, -1).catch(() => [])
  if (Array.isArray(existing)) {
    for (const m of existing) {
      if (phoneOf(m) === normalized) {
        await redis.zrem(OPTIN_KEY, m as never).catch(() => null)
      }
    }
  }

  await redis.zadd(OPTIN_KEY, { score: now, member: record }).catch(() => null)

  return res.status(200).json({ ok: true, phone: normalized })
}
