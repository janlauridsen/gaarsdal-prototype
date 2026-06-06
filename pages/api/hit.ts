// pages/api/hit.ts
//
// Registrerer page hits fra danske besøgende.
// Gemmer i Redis sorted set med timestamp som score.
// Hits ældre end 365 dage ryddes automatisk.
//
// UDVIDET tracking (v3):
// - referrer + parsed referrer-kilde (google/facebook/direkte/internt)
// - UTM-parametre (source/medium/campaign)
// - session-id (grupperer hits fra samme besøg/bruger)
// - entry-flag (første hit i en session)
// - engagement (tid på forrige side, scroll-dybde) sendes ved næste hit eller via beacon
// - viewport-bredde, sprog
// Felterne er additive; gamle hits uden dem vises bare som tomme i admin.

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

// Klassificér referrer til en grov kilde, så admin kan gruppere.
function classifyReferrer(ref: string, host: string): string {
  if (!ref) return "direkte"
  let r: string
  try { r = new URL(ref).hostname.toLowerCase() } catch { return "ukendt" }
  if (host && r.includes(host.toLowerCase())) return "internt"
  if (r.includes("google")) return "google"
  if (r.includes("bing")) return "bing"
  if (r.includes("duckduckgo")) return "duckduckgo"
  if (r.includes("facebook") || r.includes("fb.com") || r.includes("fb.me")) return "facebook"
  if (r.includes("instagram")) return "instagram"
  if (r.includes("linkedin")) return "linkedin"
  if (r.includes("youtube")) return "youtube"
  if (r.includes("t.co") || r.includes("twitter") || r.includes("x.com")) return "twitter/x"
  if (r.includes("mail") || r.includes("outlook")) return "email"
  if (r.includes("chatgpt") || r.includes("openai")) return "chatgpt"
  if (r.includes("claude") || r.includes("anthropic")) return "claude"
  if (r.includes("perplexity")) return "perplexity"
  if (r.includes("bing") || r.includes("copilot")) return "copilot"
  return "andre sites"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const country = req.headers["x-vercel-ip-country"] as string | undefined
  if (country && country !== "DK") return res.status(204).end()

  const ua = (req.headers["user-agent"] ?? "").toLowerCase()
  if (isBot(ua)) return res.status(204).end()

  const body = req.body ?? {}
  const { path } = body
  if (!path || typeof path !== "string") return res.status(400).end()
  if (EXCLUDED_PATHS.some(p => path.startsWith(p))) return res.status(204).end()

  // Nye additive felter fra klienten
  const referrer: string = typeof body.referrer === "string" ? body.referrer.slice(0, 300) : ""
  const utmSource: string = typeof body.utm_source === "string" ? body.utm_source.slice(0, 80) : ""
  const utmMedium: string = typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 80) : ""
  const utmCampaign: string = typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 120) : ""
  const sid: string = typeof body.sid === "string" ? body.sid.slice(0, 40) : ""
  const isEntry: boolean = body.entry === true
  const viewportW: number = typeof body.vw === "number" ? body.vw : 0
  const lang: string = typeof body.lang === "string" ? body.lang.slice(0, 12) : ""

  // Engagement for FORRIGE side (sendt med næste navigation eller via beacon ved exit)
  const prevPath: string = typeof body.prev_path === "string" ? body.prev_path.slice(0, 200) : ""
  const prevDwellMs: number = typeof body.prev_dwell_ms === "number" ? Math.max(0, Math.min(body.prev_dwell_ms, 3_600_000)) : 0
  const prevScrollPct: number = typeof body.prev_scroll_pct === "number" ? Math.max(0, Math.min(body.prev_scroll_pct, 100)) : 0
  const isExitBeacon: boolean = body.exit_beacon === true

  const hostHeader = (req.headers["host"] as string | undefined) ?? "gaarsdal.net"
  const referrerSource = classifyReferrer(referrer, hostHeader)

  const clientIp = (req.headers["x-vercel-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? ""
  const region = (req.headers["x-vercel-ip-country-region"] as string | undefined) ?? ""

  const redis = getRedisClient()
  if (!redis) return res.status(204).end()

  // Hvis dette kun er en exit-beacon med engagement for forrige side,
  // gem engagement som separat let event (ingen ny IP-opslag nødvendig).
  if (isExitBeacon && prevPath) {
    try {
      const ownIpsE = (process.env.OWN_IP ?? "").split(",").map(s => s.trim()).filter(Boolean)
      const isOwnE = clientIp ? ownIpsE.includes(clientIp) : false
      const now = Date.now()
      const engagement = JSON.stringify({
        type: "engagement",
        sid,
        path: prevPath,
        dwell_ms: prevDwellMs,
        scroll_pct: prevScrollPct,
        ts: new Date(now).toISOString(),
        day: new Date(now).toISOString().slice(0, 10),
        own: isOwnE,
      })
      await redis.zadd(HITS_KEY, { score: now, member: engagement })
    } catch {}
    return res.status(204).end()
  }

  // Egen-besøg: sammenlign mod OWN_IP (kommasepareret liste tilladt).
  // Vi gemmer IKKE fremmede IP'er, kun et boolean-flag.
  const ownIps = (process.env.OWN_IP ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const isOwn = clientIp ? ownIps.includes(clientIp) : false

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
  const mobile = /mobile|android|iphone|ipad|ipod/i.test(ua)

  const member = JSON.stringify({
    uid,
    ts: new Date(now).toISOString(),
    path,
    city,
    postal,
    region,
    day,
    mobile,
    // v3 additive felter:
    sid,
    entry: isEntry,
    referrer,
    referrer_source: referrerSource,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    vw: viewportW,
    lang,
    own: isOwn,
    // engagement for forrige side, hvis sendt sammen med denne navigation:
    prev_path: prevPath,
    prev_dwell_ms: prevDwellMs,
    prev_scroll_pct: prevScrollPct,
  })

  try {
    await redis.zadd(HITS_KEY, { score: now, member })
    const cutoff = now - MAX_DAYS * 24 * 60 * 60 * 1000
    await redis.zremrangebyscore(HITS_KEY, 0, cutoff)
  } catch {}

  return res.status(204).end()
}
