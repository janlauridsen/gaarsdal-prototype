import type { NextApiRequest, NextApiResponse } from "next"

import { listUserJournalIds, readJournalDefinition } from "../../../chat/persistence/journalDefinitionStore"

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

  const ids = await listUserJournalIds(userKey)
  const defs = await Promise.all(ids.map((id) => readJournalDefinition(id)))
  const journals = defs.filter(Boolean)

  return res.status(200).json({ journals })
}
