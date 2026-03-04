import type { NextApiRequest, NextApiResponse } from "next"
import { getJournalEntry } from "../../../../lib/journal/journalStore"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const journalId = typeof req.query.journalId === "string" ? req.query.journalId : ""
  const entryId = typeof req.query.entryId === "string" ? req.query.entryId : ""

  if (!journalId || !entryId) return res.status(400).json({ error: "Missing journalId/entryId" })

  const entry = await getJournalEntry(journalId, entryId)
  if (!entry) return res.status(404).json({ error: "Not Found" })
  return res.status(200).json({ entry })
}
