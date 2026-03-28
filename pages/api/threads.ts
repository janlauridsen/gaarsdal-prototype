import type { NextApiRequest, NextApiResponse } from "next"
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { ensureThreadIndex } from "../../chat/persistence/threadIndexStore"
import { PROFILE_TTL_SECONDS } from "../../chat/utils/ttl"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "GET, OPTIONS")
  if (req.method === "OPTIONS") { res.status(200).end(); return }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return }

  const userKey = ensureUserKey(req, res)
  const index = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  res.status(200).json(index)
}
