// pages/api/hit.ts
//
// Registrerer page hits fra danske besøgende.
// Filtrerer: non-DK, bots, admin-sider.
//
// POST /api/hit
// Body: { path: string }

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../chat/persistence/redis"

const HITS_KEY = "gaarsdal:hits:v1"
const MAX_HITS = 5000

const BOT_PATTERNS = [
  "bot", "crawl", "spider", "slurp", "headless", "phantom", "selenium",
  "googlebot", "bingbot", "yandex", "baidu", "duckduck", "facebookexternalhit",
  "linkedinbot", "twitterbot", "whatsapp", "curl", "python", "axios", "node-fetch",
  "lighthouse", "pagespeed", "chrome-lighthouse",
]

const EXCLUDED_PATHS = ["/admin", "/api"]

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase()
  return BOT_PATTERNS.some(p => lower.includes(p))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  // Only Danish visitors
  const country = req.headers["x-vercel-ip-country"] as string | undefined
  if (country && country !== "DK") return res.status(204).end()

  // Bot filter
  const ua = (req.headers["user-agent"] ?? "").toLowerCase()
  if (isBot(ua)) return res.status(204).end()

  // Path filter
  const { path } = req.body ?? {}
  if (!path || typeof path !== "string") return res.status(400).end()
  if (EXCLUDED_PATHS.some(p => path.startsWith(p))) return res.status(204).end()

  const clientIp = (req.headers["x-vercel-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? ""
  const region = (req.headers["x-vercel-ip-country-region"] as string | undefined) ?? ""

  // By via IPInfo
  let city = "Ukendt"
  const ipinfoToken = process.env.IPINFO_TOKEN
  if (clientIp && ipinfoToken) {
    try {
      const ipRes = await fetch(`https://ipinfo.io/${clientIp}?token=${ipinfoToken}`)
      if (ipRes.ok) {
        const ipJson = await ipRes.json()
        city = ipJson?.city ?? "Ukendt"
      }
    } catch { /* non-fatal */ }
  }
  const day = new Date().toISOString().slice(0, 10)

  const hit = {
    ts: new Date().toISOString(),
    path,
    city,
    region,
    day,
  }

  const redis = getRedisClient()
  if (!redis) return res.status(204).end()

  try {
    await redis.lpush(HITS_KEY, JSON.stringify(hit))
    await redis.ltrim(HITS_KEY, 0, MAX_HITS - 1)
  } catch {
    // non-fatal
  }

  return res.status(204).end()
}
