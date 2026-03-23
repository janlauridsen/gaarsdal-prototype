// pages/api/admin/export.ts
//
// Download alle samtaler for en given periode som JSON eller CSV.
//
// Kræver ADMIN_SECRET env-var sat i Vercel.
//
// Eksempel-kald:
//   GET /api/admin/export?secret=<ADMIN_SECRET>&from=2026-03-01&to=2026-03-31&format=csv
//   GET /api/admin/export?secret=<ADMIN_SECRET>&from=2026-03-01&to=2026-03-31&format=json
//
// Parametre:
//   secret  - skal matche ADMIN_SECRET env-var
//   from    - dato ISO (inklusiv), fx 2026-03-01
//   to      - dato ISO (inklusiv), fx 2026-03-31  (default: i dag)
//   format  - "json" eller "csv" (default: json)
//   limit   - max antal samtaler (default: 500)

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

const INDEX_KEY = "gaarsdal:index:conversations:recent"
const RAW_KEY_PREFIX = "gaarsdal:raw:conversation:"
const HANDOFFS_KEY = "gaarsdal:handoffs:v1"
const LEADS_KEY = "gaarsdal:leads:v1"
const FEEDBACK_KEY = "gaarsdal:feedback:all"

type RawTurn = {
  ts: string
  conversation_id: string
  revision: number
  node_id: string
  input_type: string
  user_input: string
  assistant_output: string
}

type Handoff = {
  id: string
  received_at: string
  navn: string
  emne: string
  kontakt: string
  besked?: string
  email_status?: string
  conversation_id: string
}

type ExportRow = {
  conversation_id: string
  started_at: string
  turn: number
  node: string
  user: string
  assistant: string
}

function parseDate(s: string, endOfDay = false): number {
  const d = new Date(s)
  if (isNaN(d.getTime())) throw new Error(`Ugyldig dato: ${s}`)
  if (endOfDay) {
    d.setUTCHours(23, 59, 59, 999)
  } else {
    d.setUTCHours(0, 0, 0, 0)
  }
  return d.getTime()
}

function escCsv(s: string): string {
  const clean = (s ?? "").replace(/\r?\n/g, " ").replace(/\t/g, " ")
  if (clean.includes(",") || clean.includes('"') || clean.includes("\n")) {
    return `"${clean.replace(/"/g, '""')}"`
  }
  return clean
}

function rowsToCsv(rows: ExportRow[]): string {
  const header = ["conversation_id", "started_at", "turn", "node", "user", "assistant"].join(",")
  const lines = rows.map((r) =>
    [
      escCsv(r.conversation_id),
      escCsv(r.started_at),
      String(r.turn),
      escCsv(r.node),
      escCsv(r.user),
      escCsv(r.assistant),
    ].join(",")
  )
  return [header, ...lines].join("\n")
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  // Auth
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) {
    return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret i Vercel env" })
  }
  const { secret, from, to, format = "json", limit = "500", include_handoffs = "0" } = req.query
  if (secret !== adminSecret) {
    return res.status(401).json({ error: "Ugyldig secret" })
  }

  const redis = getRedisClient()
  if (!redis) {
    return res.status(503).json({ error: "Redis ikke tilgængelig" })
  }

  // Parse dates
  let fromMs: number
  let toMs: number
  try {
    fromMs = from ? parseDate(String(from)) : Date.now() - 30 * 24 * 60 * 60 * 1000
    toMs = to ? parseDate(String(to), true) : Date.now()
  } catch (e: any) {
    return res.status(400).json({ error: e.message })
  }

  const maxLimit = Math.min(Number(limit) || 500, 2000)

  try {
    // 1. Find conversation IDs i perioden via sorted set
    // Upstash Redis SDK v1: zrange with byScore option
    const conversationIds = await redis.zrange(
      INDEX_KEY,
      fromMs,
      toMs,
      { byScore: true, count: maxLimit, offset: 0 }
    ) as string[]

    if (!conversationIds || conversationIds.length === 0) {
      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv; charset=utf-8")
        res.setHeader("Content-Disposition", `attachment; filename="samtaler-${String(from ?? "export")}.csv"`)
        return res.status(200).send("conversation_id,started_at,turn,node,user,assistant\n")
      }
      return res.status(200).json({ conversations: [], total: 0, from: new Date(fromMs).toISOString(), to: new Date(toMs).toISOString() })
    }

    // 2. Hent rådata for hver samtale
    const allRows: ExportRow[] = []
    const allConversations: Array<{ conversation_id: string; turns: RawTurn[] }> = []

    for (const convId of conversationIds) {
      const rawItems = await redis.lrange(`${RAW_KEY_PREFIX}${convId}`, 0, -1) as unknown[]
      if (!rawItems || rawItems.length === 0) continue

      const turns: RawTurn[] = rawItems
        .map((item) => {
          if (item && typeof item === "object") return item
          try { return JSON.parse(item as string) } catch { return null }
        })
        .filter(Boolean) as RawTurn[]

      allConversations.push({ conversation_id: convId, turns })

      for (let i = 0; i < turns.length; i++) {
        const t = turns[i]
        allRows.push({
          conversation_id: convId,
          started_at: turns[0]?.ts ?? "",
          turn: i + 1,
          node: t.node_id ?? "",
          user: t.user_input ?? "",
          assistant: t.assistant_output ?? "",
        })
      }
    }

    // 3. Optionelt: medtag handoffs og leads
    let handoffs: unknown[] = []
    let leads: unknown[] = []
    let feedbackItems: unknown[] = []
    if (include_handoffs === "1") {
      const rawFeedback = await redis.lrange(FEEDBACK_KEY, 0, 499) as unknown[]
      feedbackItems = rawFeedback.map((f) => {
        if (f && typeof f === "object") return f
        try { return JSON.parse(f as string) } catch { return null }
      }).filter(Boolean)

      const rawHandoffs = await redis.lrange(HANDOFFS_KEY, 0, 199) as unknown[]
      handoffs = rawHandoffs.map((h) => {
        if (h && typeof h === "object") return h
        try { return JSON.parse(h as string) } catch { return null }
      }).filter(Boolean)

      const rawLeads = await redis.lrange(LEADS_KEY, 0, 199) as unknown[]
      leads = rawLeads.map((l) => {
        if (l && typeof l === "object") return l
        try { return JSON.parse(l as string) } catch { return null }
      }).filter(Boolean)
    }

    // 3b. Fetch any handoff-linked conversations not already in the period
    if (include_handoffs === "1" && handoffs.length > 0) {
      const alreadyFetched = new Set(allConversations.map((c) => c.conversation_id))
      const extraIds = (handoffs as Handoff[])
        .map((h) => h.conversation_id)
        .filter((id) => id && !alreadyFetched.has(id))

      for (const convId of extraIds) {
        const rawItems = await redis.lrange(`${RAW_KEY_PREFIX}${convId}`, 0, -1) as unknown[]
        if (!rawItems || rawItems.length === 0) continue
        const turns: RawTurn[] = rawItems.map((item) => {
          if (item && typeof item === "object") return item as RawTurn
          try { return JSON.parse(item as string) as RawTurn } catch { return null }
        }).filter(Boolean) as RawTurn[]
        if (turns.length) allConversations.push({ conversation_id: convId, turns })
      }
    }

    // 4. Returner
    if (format === "csv") {
      const csv = rowsToCsv(allRows)
      res.setHeader("Content-Type", "text/csv; charset=utf-8")
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="samtaler-${String(from ?? "export")}-til-${String(to ?? "nu")}.csv"`
      )
      return res.status(200).send(csv)
    }

    return res.status(200).json({
      from: new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
      total_conversations: allConversations.length,
      total_turns: allRows.length,
      conversations: allConversations,
      ...(include_handoffs === "1" ? { handoffs, leads, feedback: feedbackItems } : {}),
    })
  } catch (e: any) {
    return res.status(500).json({
      error: "Eksport fejlede",
      detail: process.env.NODE_ENV === "development" ? String(e?.message ?? e) : undefined,
    })
  }
}
