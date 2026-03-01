import type { NextApiRequest, NextApiResponse } from "next"

import { listUserJournalIds, readJournalDefinition } from "../../../chat/persistence/journalDefinitionStore"
import { readJournalEntriesRange } from "../../../chat/persistence/journalEntryStore"

const COOKIE_NAME = "gaarsdal_uid"

function parseCookie(req: NextApiRequest, name: string): string | null {
  const raw = req.headers.cookie
  if (!raw) return null
  const parts = raw.split(";").map((p) => p.trim())
  for (const part of parts) {
    const [k, ...rest] = part.split("=")
    if (k === name) return decodeURIComponent(rest.join("=") || "")
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = parseCookie(req, COOKIE_NAME)
  if (!userKey) return res.status(401).json({ error: "Unauthorized" })

  const journal_id = typeof req.query.journal_id === "string" ? req.query.journal_id : ""
  if (!journal_id) return res.status(400).json({ error: "Missing journal_id" })

  const format = typeof req.query.format === "string" ? req.query.format : "json"
  const fromTsMs = typeof req.query.from_ts_ms === "string" ? Number(req.query.from_ts_ms) : undefined
  const toTsMs = typeof req.query.to_ts_ms === "string" ? Number(req.query.to_ts_ms) : undefined

  const journalIds = await listUserJournalIds(userKey)
  if (!journalIds.includes(journal_id)) return res.status(403).json({ error: "Forbidden" })

  const def = await readJournalDefinition(journal_id)
  const entries = await readJournalEntriesRange(journal_id, {
    fromTsMs: Number.isFinite(fromTsMs as any) ? (fromTsMs as number) : undefined,
    toTsMs: Number.isFinite(toTsMs as any) ? (toTsMs as number) : undefined,
    limit: 50_000,
  })

  if (format === "jsonl") {
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8")
    res.setHeader("Content-Disposition", `attachment; filename="journal-${journal_id}.jsonl"`)
    const lines: string[] = []
    if (def) lines.push(JSON.stringify({ type: "definition", value: def }))
    for (const e of entries) lines.push(JSON.stringify({ type: "entry", value: e }))
    return res.status(200).send(lines.join("\n"))
  }

  // default JSON
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="journal-${journal_id}.json"`)
  return res.status(200).json({ definition: def, entries })
}
