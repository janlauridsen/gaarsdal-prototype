import type { NextApiRequest, NextApiResponse } from "next"
import { listJournalEntries } from "../../../../lib/journal/journalStore"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const journalId = typeof req.query.journalId === "string" ? req.query.journalId : ""
  if (!journalId) return res.status(400).json({ error: "Missing journalId" })

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined
  const fromTsMs = typeof req.query.fromTsMs === "string" ? Number(req.query.fromTsMs) : undefined
  const toTsMs = typeof req.query.toTsMs === "string" ? Number(req.query.toTsMs) : undefined
  const reverse = typeof req.query.reverse === "string" ? req.query.reverse !== "false" : true

  const entries = await listJournalEntries(journalId, {
    limit: typeof limit === "number" && Number.isFinite(limit) ? limit : undefined,
    fromTsMs: typeof fromTsMs === "number" && Number.isFinite(fromTsMs) ? fromTsMs : undefined,
    toTsMs: typeof toTsMs === "number" && Number.isFinite(toTsMs) ? toTsMs : undefined,
    reverse,
  })

  return res.status(200).json({ entries })
}
