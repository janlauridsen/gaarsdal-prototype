import type { NextApiRequest, NextApiResponse } from "next"

import { readConversationState } from "../../chat/persistence/conversationStateStore"
import { readUserProfile } from "../../chat/memory/store"

type InsightsMetaEntry = { value: unknown; source_node: string }

type InsightsResponse = {
  user_key_present: boolean
  conversation_id?: string
  active_node?: string
  revision?: number
  status?: string
  meta?: Record<string, InsightsMetaEntry>
  profile?: unknown
  blocked_keys?: string[]
}

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

function pruneMeta(meta: any): Record<string, InsightsMetaEntry> {
  if (!meta || typeof meta !== "object") return {}

  const out: Record<string, InsightsMetaEntry> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (!v || typeof v !== "object") continue
    const vv = v as any
    if (!("value" in vv)) continue
    out[k] = {
      value: vv.value,
      source_node: typeof vv.source_node === "string" ? vv.source_node : "",
    }
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = parseCookie(req, COOKIE_NAME)

  if (!userKey) {
    const payload: InsightsResponse = {
      user_key_present: false,
      blocked_keys: [],
    }
    return res.status(200).json(payload)
  }

  const conversationId = `u:${userKey}`

  const state = await readConversationState(conversationId)
  const profile = await readUserProfile(userKey)

  const meta = state ? pruneMeta(state.meta) : {}
  const blockedKeys: string[] = []

  // markér meta som ikke bør vises (PII / sikkerhed / størrelse)
  const blockedPrefixes = ["triage.transcript", "gen_hypno.transcript", "method_fit.transcript"]
  for (const k of Object.keys(meta)) {
    if (blockedPrefixes.some((p) => k.startsWith(p))) blockedKeys.push(k)
  }

  for (const k of blockedKeys) {
    delete meta[k]
  }

  const payload: InsightsResponse = {
    user_key_present: true,
    conversation_id: state?.conversation_id ?? conversationId,
    active_node: state?.active_node,
    revision: state?.revision,
    status: state?.status,
    meta,
    profile,
    blocked_keys: blockedKeys.sort(),
  }

  return res.status(200).json(payload)
}
