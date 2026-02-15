import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"
import { readFacts, upsertFact, type MemoryFact, type FactStatus } from "../../../chat/memory/longTermMemoryStore"

const COOKIE_NAME = "gaarsdal_uid"
const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60 // align for now

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

function uuid(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
}

/**
 * Prod guard:
 * - if MEMORY_API_SECRET is set, require ?secret=... for GET/PATCH
 * Dev:
 * - if not set, allow calls with cookie presence.
 */
function authorize(req: NextApiRequest): { ok: boolean; reason?: string } {
  const configured = process.env.MEMORY_API_SECRET
  if (!configured) return { ok: true }

  const provided = typeof req.query.secret === "string" ? req.query.secret : ""
  if (provided !== configured) return { ok: false, reason: "Unauthorized" }
  return { ok: true }
}

type PatchBody =
  | { action: "accept"; fact_id: string }
  | { action: "reject"; fact_id: string }
  | { action: "edit"; fact_id: string; value: any }

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null
}

function isFactStatus(x: any): x is FactStatus {
  return x === "suggested" || x === "canonical" || x === "rejected"
}

function applyPatch(params: { fact: MemoryFact; patch: PatchBody }): MemoryFact {
  const ts = Date.now()
  const base = { ...params.fact, updated_at: ts }
  const history = Array.isArray(base.edit_history) ? [...base.edit_history] : []

  if (params.patch.action === "accept") {
    const prev = base.status
    base.status = "canonical"
    history.push({ ts, editor: "user", note: `status: ${prev} -> canonical` })
  }

  if (params.patch.action === "reject") {
    const prev = base.status
    base.status = "rejected"
    history.push({ ts, editor: "user", note: `status: ${prev} -> rejected` })
  }

  if (params.patch.action === "edit") {
    const prevValue = base.value
    base.value = params.patch.value
    // edit implies canonical (user approved/curated)
    const prevStatus = base.status
    base.status = "canonical"
    history.push({
      ts,
      editor: "user",
      prev_value: prevValue,
      next_value: params.patch.value,
      note: `edit; status: ${prevStatus} -> canonical`,
    })
  }

  base.provenance = {
    ...base.provenance,
    last_edited_by: "user",
  }
  base.edit_history = history
  return base
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = authorize(req)
  if (!auth.ok) return res.status(401).json({ error: auth.reason ?? "Unauthorized" })

  const userKey = parseCookie(req, COOKIE_NAME)
  if (!userKey) return res.status(200).json({ user_key_present: false, facts: [] })

  if (req.method === "GET") {
    const status = typeof req.query.status === "string" ? req.query.status : ""
    const facts = await readFacts({ userKey, limit: 500, status: isFactStatus(status) ? status : undefined })
    return res.status(200).json({ user_key_present: true, facts })
  }

  if (req.method === "PATCH") {
    if (!isObject(req.body)) return res.status(400).json({ error: "Invalid JSON body" })

    const patch = req.body as PatchBody
    if (!patch || typeof (patch as any).action !== "string" || typeof (patch as any).fact_id !== "string") {
      return res.status(400).json({ error: "Invalid patch body" })
    }

    const all = await readFacts({ userKey, limit: 500 })
    const fact = all.find((f) => f.fact_id === patch.fact_id)
    if (!fact) return res.status(404).json({ error: "Fact not found" })

    const next = applyPatch({ fact, patch })

    // Ensure fact_id stable even if malformed input
    next.fact_id = fact.fact_id || uuid()

    await upsertFact({ userKey, fact: next, ttlSeconds: MEMORY_TTL_SECONDS })
    return res.status(200).json({ ok: true, fact: next })
  }

  res.setHeader("Allow", "GET, PATCH")
  return res.status(405).json({ error: "Method Not Allowed" })
}
