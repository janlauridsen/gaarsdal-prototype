import type { NextApiRequest, NextApiResponse } from "next"
import { randomUUID } from "crypto"
import { createJournalEntry } from "../../../../lib/journal/journalStore"
import { clampTsMs } from "../../../../lib/journal/journalSchema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const { journalId, kind, ts_ms, text, fields } = (req.body ?? {}) as any
  if (typeof journalId !== "string" || !journalId) return res.status(400).json({ error: "Missing journalId" })
  if (kind !== "alcohol_drink" && kind !== "alcohol_urge") return res.status(400).json({ error: "Invalid kind" })

  const entryId = randomUUID()
  const entry = await createJournalEntry(journalId, entryId, {
    kind,
    ts_ms: typeof ts_ms === "number" ? clampTsMs(ts_ms) : undefined,
    text: typeof text === "string" ? text : undefined,
    fields: typeof fields === "object" && fields ? fields : undefined,
  })

  if (!entry) return res.status(503).json({ error: "Journal storage unavailable" })
  return res.status(200).json({ entry })
}
