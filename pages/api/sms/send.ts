// pages/api/sms/send.ts
// Sender SMS til valgt liste via GatewayAPI.
// Kræver ADMIN_TOKEN. Tilføjer altid "Svar STOP for at afmelde" hvis ikke allerede til stede.
// Logger sendt SMS i Redis.

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { SENT_KEY, STOPPED_KEY } from "./optin"

const GATEWAYAPI_ENDPOINT = "https://gatewayapi.com/rest/mtsms"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end()

  const token = req.headers["x-admin-token"] ?? req.body?.adminToken
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const { message, recipients }: { message: string; recipients: string[] } = req.body ?? {}
  if (!message || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "Mangler besked eller modtagere" })
  }

  const apiToken = process.env.GATEWAYAPI_TOKEN
  if (!apiToken) {
    return res.status(500).json({ error: "GATEWAYAPI_TOKEN mangler i env" })
  }

  const redis = getRedisClient()

  // Tilføj STOP-instruks automatisk hvis ikke allerede i beskeden
  const stopText = "Afmeld: gaarsdal.net/afmeld"
  const fullMessage = message.toLowerCase().includes("afmeld") || message.toLowerCase().includes("gaarsdal.net/afmeld") ? message : `${message}\n${stopText}`

  // Filtrer STOP-listen
  const stopped = redis ? await redis.smembers(STOPPED_KEY).catch(() => []) : []
  const filtered = recipients.filter(r => !stopped.includes(r))

  if (filtered.length === 0) {
    return res.status(200).json({ ok: true, sent: 0, skipped: recipients.length, reason: "alle på STOP-liste" })
  }

  // Send via GatewayAPI REST
  const payload = {
    sender: "Gaarsdal",
    message: fullMessage,
    recipients: filtered.map(msisdn => ({ msisdn: msisdn.replace("+", "") })),
  }

  let gatewayResult: any = null
  let gatewayError: string | null = null
  try {
    const gwRes = await fetch(GATEWAYAPI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiToken}`,
      },
      body: JSON.stringify(payload),
    })
    gatewayResult = await gwRes.json()
    if (!gwRes.ok) gatewayError = JSON.stringify(gatewayResult)
  } catch (err) {
    gatewayError = String(err)
  }

  // Log i Redis
  if (redis && !gatewayError) {
    const now = Date.now()
    const log = JSON.stringify({
      ts: new Date(now).toISOString(),
      message: fullMessage,
      recipients: filtered,
      sent: filtered.length,
      skipped: recipients.length - filtered.length,
    })
    await redis.zadd(SENT_KEY, { score: now, member: log }).catch(() => null)
  }

  if (gatewayError) {
    return res.status(502).json({ ok: false, error: gatewayError, payload })
  }

  return res.status(200).json({
    ok: true,
    sent: filtered.length,
    skipped: recipients.length - filtered.length,
    gatewayResult,
  })
}
