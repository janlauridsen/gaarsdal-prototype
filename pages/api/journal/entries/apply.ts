import type { NextApiRequest, NextApiResponse } from "next"
import { applyJournalChanges } from "../../../../lib/journal/applyChanges"
import { getJournalEntry, putJournalEntry } from "../../../../lib/journal/journalStore"
import { JournalChange } from "../../../../lib/journal/journalSchema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const { journalId, entryId, changes, baseRevision } = (req.body ?? {}) as any
  if (typeof journalId !== "string" || !journalId) return res.status(400).json({ error: "Missing journalId" })
  if (typeof entryId !== "string" || !entryId) return res.status(400).json({ error: "Missing entryId" })

  const entry = await getJournalEntry(journalId, entryId)
  if (!entry) return res.status(404).json({ error: "Not Found" })

  if (typeof baseRevision === "number" && typeof entry.revision === "number" && baseRevision !== entry.revision) {
    return res.status(409).json({ error: "Revision conflict", entry })
  }

  const parsedChanges: JournalChange[] = Array.isArray(changes) ? changes : []
  const result = applyJournalChanges(entry, parsedChanges)

  await putJournalEntry(journalId, result.entry)

  return res.status(200).json({
    entry: result.entry,
    applied: result.applied,
    ignored: result.ignored,
  })
}
