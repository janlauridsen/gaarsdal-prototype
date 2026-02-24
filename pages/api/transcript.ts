import type { NextApiRequest, NextApiResponse } from "next"

import { readRawTurns } from "../../chat/raw/store"

type TranscriptMessage = {
  role: "user" | "assistant"
  text: string
  revision: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { conversation_id, limit_turns } = req.query
  const conversationId = typeof conversation_id === "string" ? conversation_id : ""
  if (!conversationId) {
    res.status(400).json({ error: "missing conversation_id" })
    return
  }

  const limitTurnsRaw = typeof limit_turns === "string" ? Number(limit_turns) : NaN
  const limitTurns = Number.isFinite(limitTurnsRaw) ? Math.max(1, Math.min(50, Math.floor(limitTurnsRaw))) : 20

  const turns = await readRawTurns({ conversationId, limit: limitTurns })

  const messages: TranscriptMessage[] = []
  for (const t of turns) {
    const user = typeof t.user_input === "string" ? t.user_input.trim() : ""
    const bot = typeof t.assistant_output === "string" ? t.assistant_output.trim() : ""
    if (user) messages.push({ role: "user", text: user, revision: t.revision })
    if (bot) messages.push({ role: "assistant", text: bot, revision: t.revision })
  }

  res.status(200).json({ conversation_id: conversationId, limit_turns: limitTurns, messages })
}
