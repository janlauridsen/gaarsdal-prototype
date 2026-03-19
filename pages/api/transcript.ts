import type { NextApiRequest, NextApiResponse } from "next"

import { readRawTurns } from "../../chat/raw/store"

type TranscriptMessage = {
  role: "user" | "assistant"
  content: string
  revision?: number
  node_id?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method Not Allowed" })
    return
  }

  const conversation_id = typeof req.query.conversation_id === "string" ? req.query.conversation_id : ""
  if (!conversation_id) {
    res.status(400).json({ error: "Missing conversation_id" })
    return
  }

  const limitTurnsRaw = typeof req.query.limit_turns === "string" ? Number.parseInt(req.query.limit_turns, 10) : 20
  const limitTurns = Number.isFinite(limitTurnsRaw) ? Math.max(1, Math.min(limitTurnsRaw, 20)) : 20

  // Each raw turn contains user_input + assistant_output. We fetch a bit more than needed
  // to be resilient to empty entries.
  const raw = await readRawTurns({ conversationId: conversation_id, limit: limitTurns * 3 })

  // Map to chronological order and take last N turns with content.
  const turns = raw
    .map((t) => ({
      user: typeof t.user_input === "string" ? t.user_input : "",
      assistant: typeof t.assistant_output === "string" ? t.assistant_output : "",
      revision: typeof t.revision === "number" ? t.revision : undefined,
      node_id: typeof t.node_id === "string" ? t.node_id : undefined,
    }))
    .filter((t) => t.user.trim() || t.assistant.trim())

  const last = turns.slice(-limitTurns)

  const messages: TranscriptMessage[] = []
  for (const t of last) {
    if (t.user.trim()) messages.push({ role: "user", content: t.user, revision: t.revision, node_id: t.node_id })
    if (t.assistant.trim()) messages.push({ role: "assistant", content: t.assistant, revision: t.revision, node_id: t.node_id })
  }

  res.status(200).json({ conversation_id, limit_turns: limitTurns, messages })
}
