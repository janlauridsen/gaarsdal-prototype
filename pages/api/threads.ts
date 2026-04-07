import type { NextApiRequest, NextApiResponse } from "next"
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { ensureThreadIndex, readThreadIndex, createEmptyThreadIndex } from "../../chat/persistence/threadIndexStore"
import { PROFILE_TTL_SECONDS } from "../../chat/utils/ttl"
import { readConsent, consentAllowsPersistence } from "../../chat/consent/store"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "GET, OPTIONS")
  if (req.method === "OPTIONS") { res.status(200).end(); return }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return }

  const userKey = ensureUserKey(req, res)
  const consentRecord = await readConsent(userKey)

  // Session-only: læs hvad der måske er der, men opret aldrig en ny tom index i Redis
  if (!consentAllowsPersistence(consentRecord)) {
    const existing = await readThreadIndex(userKey)
    res.status(200).json(existing ?? createEmptyThreadIndex(userKey))
    return
  }

  const index = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  res.status(200).json(index)
}
