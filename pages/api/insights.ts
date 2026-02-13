import type { NextApiRequest, NextApiResponse } from "next"

// NOTE:
// Denne route forudsætter, at du allerede har helper-funktioner til at læse:
// - state (ConversationState) fra Redis
// - profile fra Redis
//
// Jeg kan ikke gætte dine interne import-paths her uden at se din repo-struktur.
// Derfor leverer jeg en "adapter"-version hvor du selv udfylder 2 imports.
// Når du indsætter de 2 imports korrekt, er filen ellers færdig.

type InsightsMetaEntry = { value: unknown; source_node: string }

type InsightsResponse = {
  user_key_present: boolean
  conversation_id?: string
  active_node?: string
  revision?: number
  profile?: unknown
  meta?: Record<string, InsightsMetaEntry>
}

const COOKIE_NAME = "gaarsdal_uid"

function safeMetaFilter(meta: Record<string, InsightsMetaEntry> | undefined) {
  if (!meta) return {}

  // Undgå at dumpe transcripts som standard.
  const blockedKeys = new Set(["triage.transcript", "gen_hypno.transcript"])

  // Tillad kun et begrænset sæt domæner
  const allowedPrefixes = ["triage.", "gen_hypno."]

  const out: Record<string, InsightsMetaEntry> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (blockedKeys.has(k)) continue
    if (!allowedPrefixes.some((p) => k.startsWith(p))) continue
    out[k] = v
  }
  return out
}

/**
 * UDFYLD DISSE TO FUNKTIONER VIA IMPORTS FRA DIT PROJEKT:
 * - readConversationState(conversationId)
 * - readUserProfile(userKey)
 *
 * Hvis du indsætter de eksisterende filer her i tråden, kan jeg levere dem 100% korrekt.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function readConversationState(_conversationId: string): Promise<any | null> {
  throw new Error(
    "readConversationState() mangler. Importér din eksisterende funktion her."
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function readUserProfile(_userKey: string): Promise<any | null> {
  throw new Error(
    "readUserProfile() mangler. Importér din eksisterende funktion her."
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = req.cookies?.[COOKIE_NAME]
  if (!userKey || typeof userKey !== "string") {
    const payload: InsightsResponse = { user_key_present: false }
    return res.status(200).json(payload)
  }

  const conversationId = `u:${userKey}`

  const [state, profile] = await Promise.all([
    readConversationState(conversationId),
    readUserProfile(userKey),
  ])

  const payload: InsightsResponse = {
    user_key_present: true,
    conversation_id: conversationId,
    active_node: state?.active_node,
    revision: state?.revision,
    profile: profile ?? null,
    meta: safeMetaFilter(state?.meta),
  }

  return res.status(200).json(payload)
}
