// pages/api/consent.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import {
  readConsent,
  writeConsent,
  deleteAllUserData,
  type ConsentRecord,
  type ConsentRetentionDays,
} from "../../chat/consent/store"

const VALID_RETENTION_DAYS: ConsentRetentionDays[] = [0, 30, 90, 365]

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setWidgetCors(req, res, "GET, POST, DELETE, OPTIONS")
  if (req.method === "OPTIONS") return res.status(200).end()

  const userKey = ensureUserKey(req, res)

  // ── GET: hent nuværende samtykke-status ─────────────────────────────────────
  if (req.method === "GET") {
    const record = await readConsent(userKey)
    return res.status(200).json({ consent: record })
  }

  // ── POST: gem nyt samtykke ───────────────────────────────────────────────────
  if (req.method === "POST") {
    const { retentionDays } = req.body ?? {}

    if (!VALID_RETENTION_DAYS.includes(retentionDays)) {
      return res.status(400).json({
        error: `retentionDays skal være et af: ${VALID_RETENTION_DAYS.join(", ")}`,
      })
    }

    const record: ConsentRecord = {
      version: 1,
      allowed: (retentionDays as number) > 0,
      retentionDays: retentionDays as ConsentRetentionDays,
      consentedAt: new Date().toISOString(),
    }

    await writeConsent(userKey, record)
    return res.status(200).json({ ok: true, consent: record })
  }

  // ── DELETE: slet alle brugerdata ─────────────────────────────────────────────
  if (req.method === "DELETE") {
    const result = await deleteAllUserData(userKey)
    return res.status(200).json({ ok: true, ...result })
  }

  return res.status(405).json({ error: "Method Not Allowed" })
}
