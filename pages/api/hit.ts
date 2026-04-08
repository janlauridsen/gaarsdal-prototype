// pages/api/hit.ts
//
// Registrerer page hits fra danske besøgende.
// Gemmer i Redis sorted set med timestamp som score.
// Hits ældre end 365 dage ryddes automatisk.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../chat/persistence/redis"

const HITS_KEY = "gaarsdal:hits:v2"
const MAX_DAYS = 365

const BOT_PATTERNS = [
  "bot", "crawl", "spider", "slurp", "headless", "phantom", "selenium",
  "googlebot", "bingbot", "yandex", "baidu", "duckduck", "facebookexternalhit",
  "linkedinbot", "twitterbot", "whatsapp", "curl", "python", "axios", "node-fetch",
  "lighthouse", "pagespeed", "chrome-lighthouse",
]

const EXCLUDED_PATHS = ["/admin", "/api"]

function isBot(ua: string): boolean {
  return BOT_PATTERNS.some(p => ua.toLowerCase().includes(p))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const country = req.headers["x-vercel-ip-country"] as string | undefined
  if (country && country !== "DK") return res.status(204).end()

  const ua = (req.headers["user-agent"] ?? "").toLowerCase()
  if (isBot(ua)) return res.status(204).end()

  const { path } = req.body ?? {}
  if (!path || typeof path !== "string") return res.status(400).end()
  if (EXCLUDED_PATHS.some(p => path.startsWith(p))) return res.status(204).end()

  const clientIp = (req.headers["x-vercel-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? ""
  const region = (req.headers["x-vercel-ip-country-region"] as string | undefined) ?? ""

  let city = "Ukendt"
  let postal = ""
  const ipinfoToken = process.env.IPINFO_TOKEN
  if (clientIp && ipinfoToken) {
    try {
      const ipRes = await fetch(`https://ipinfo.io/${clientIp}?token=${ipinfoToken}`)
      if (ipRes.ok) {
        const ipJson = await ipRes.json()
        city = ipJson?.city ?? "Ukendt"
        postal = ipJson?.postal ?? ""
      }
    } catch {}
  }

  const now = Date.now()
  const day = new Date(now).toISOString().slice(0, 10)
  const uid = Math.random().toString(36).slice(2, 8)

  // Member er unik: uid sikrer ingen kollision selv ved samme ms
  const member = JSON.stringify({ uid, ts: new Date(now).toISOString(), path, city, postal, region, day })

  const redis = getRedisClient()
  if (!redis) return res.status(204).end()

  try {
    await redis.zadd(HITS_KEY, { score: now, member })
    // Ryd hits ældre end MAX_DAYS
    const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000
    await redis.zremrangebyscore(HITS_KEY, 0, cutoff)
  } catch {}

  return res.status(204).end()
}
