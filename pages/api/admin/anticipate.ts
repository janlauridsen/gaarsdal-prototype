// pages/api/admin/anticipate.ts
//
// Returnerer alle anticipate_turn drafts for en given samtale.
// Bruges i admin til at vise hvad lookahead-systemet forventede og instruerede.
//
// GET /api/admin/anticipate?secret=<ADMIN_SECRET>&conversation_id=<id>

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const KEY_PREFIX = "gaarsdal:"

function checkAuth(req: NextApiRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  const provided = typeof req.query.secret === "string" ? req.query.secret : ""
  return !secret || provided === secret
}

export type AnticipateDraftRecord = {
  job_id: string
  based_on_revision: number
  anticipated_user_text: string
  rhetorical_instruction: string
  conversation_goal_hypothesis: string | null
  created_at: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!checkAuth(req)) return res.status(401).json({ error: "Unauthorized" })

  const conversation_id = typeof req.query.conversation_id === "string" ? req.query.conversation_id : null
  if (!conversation_id) return res.status(400).json({ error: "conversation_id påkrævet" })

  const client = getRedisClient()
  if (!client) return res.status(500).json({ error: "Redis ikke tilgængelig" })

  try {
    // Hent alle anticipate-draft keys — keys() bruges fremfor scan (Upstash REST)
    const pattern = `${KEY_PREFIX}anticipate:draft:conversation:${conversation_id}:*`
    const draftKeys: string[] = await (client as any).keys(pattern)

    if (draftKeys.length === 0) {
      return res.status(200).json({ drafts: [] })
    }

    // Hent alle drafts
    const rawDrafts = await Promise.all(
      draftKeys.map(async (key: string) => {
        const raw = await client.get(key)
        if (!raw) return null
        return typeof raw === "string" ? JSON.parse(raw) : raw
      })
    )

    const drafts: AnticipateDraftRecord[] = rawDrafts
      .filter(Boolean)
      .map((d: any) => ({
        job_id: d.job_id,
        based_on_revision: d.based_on_revision ?? 0,
        anticipated_user_text: d.open_questions?.[0] ?? "",
        rhetorical_instruction: d.summary_draft ?? "",
        conversation_goal_hypothesis: typeof d.conversation_goal_hypothesis === "string"
          ? d.conversation_goal_hypothesis
          : null,
        created_at: d.created_at ?? 0,
      }))
      .sort((a, b) => a.based_on_revision - b.based_on_revision)

    return res.status(200).json({ drafts })
  } catch (e: any) {
    return res.status(500).json({ error: e.message ?? "Ukendt fejl" })
  }
}
