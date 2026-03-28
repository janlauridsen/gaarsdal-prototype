import type { NextApiRequest, NextApiResponse } from "next"
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { readConversationState } from "../../chat/persistence/conversationStateStore"
import { ensureThreadIndex } from "../../chat/persistence/threadIndexStore"
import { withThreadMeta } from "../../chat/utils/conversation"
import { PROFILE_TTL_SECONDS } from "../../chat/utils/ttl"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "GET, OPTIONS")
  if (req.method === "OPTIONS") { res.status(200).end(); return }
  if (req.method !== "GET") { res.status(405).json({ error: "Method Not Allowed" }); return }

  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId.trim() : ""
  if (!conversationId) { res.status(400).json({ error: "Missing conversationId" }); return }

  ensureUserKey(req, res) // sets cookie if missing
  const [state, index] = await Promise.all([
    readConversationState(conversationId),
    ensureThreadIndex({ userKey: ensureUserKey(req, res), ttlSeconds: PROFILE_TTL_SECONDS }),
  ])

  if (!state) { res.status(404).json({ error: "Not found" }); return }

  res.status(200).json(withThreadMeta(state, index))
}
