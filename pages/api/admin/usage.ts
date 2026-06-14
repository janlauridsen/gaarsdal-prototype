// pages/api/admin/usage.ts
// GET /api/admin/usage?secret=<ADMIN_SECRET>&days=30
// Returnerer anonyme brugstællere for chatbots/AI-assistenter.
import type { NextApiRequest, NextApiResponse } from "next"
import { readUsage, type UsageBotType } from "../../../chat/analytics/usage"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret" })
  const secret = req.query.secret ?? req.headers["x-admin-secret"]
  if (secret !== adminSecret) return res.status(401).json({ error: "Ugyldig secret" })

  const days = Math.min(Math.max(Number(req.query.days ?? 30), 1), 90)
  const bots: UsageBotType[] = ["alcohol", "children", "standard"]

  try {
    const usage = await readUsage(bots, days)
    res.setHeader("Cache-Control", "no-store")
    return res.status(200).json(usage)
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
}
