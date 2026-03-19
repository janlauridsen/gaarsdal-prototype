import type { NextApiRequest, NextApiResponse } from "next"

import { ensureUserKey } from "./_utils/auth"
import { setWidgetCors } from "./_utils/cors"
import { appendFeedback, type FeedbackRating, type FeedbackTag } from "../../chat/feedback/store"
import { readThreadIndex } from "../../chat/persistence/threadIndexStore"

const ALLOWED_RATINGS: FeedbackRating[] = ["positive", "partial", "negative"]
const ALLOWED_TAGS: FeedbackTag[] = [
  "helpful",
  "too_interpretive",
  "too_directive",
  "too_generic",
  "not_concrete",
  "misunderstood",
  "too_reflective",
  "other",
]

function toLobbyConversationId(userKey: string): string {
  return `lobby:u:${userKey}`
}

function asTrimmedString(value: unknown, max = 1000): string {
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : ""
}

function asRating(value: unknown): FeedbackRating | null {
  if (typeof value !== "string") return null
  return (ALLOWED_RATINGS as string[]).includes(value) ? (value as FeedbackRating) : null
}

function asTags(value: unknown): FeedbackTag[] {
  if (!Array.isArray(value)) return []
  const out: FeedbackTag[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== "string") continue
    if (!(ALLOWED_TAGS as string[]).includes(item)) continue
    if (seen.has(item)) continue
    seen.add(item)
    out.push(item as FeedbackTag)
    if (out.length >= 8) break
  }
  return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "POST, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const body = req.body ?? {}

  const conversationId = asTrimmedString(body.conversationId, 200)
  const rating = asRating(body.rating)
  const tags = asTags(body.tags)
  const note = asTrimmedString(body.note, 2000)
  const revision = typeof body.revision === "number" ? body.revision : undefined
  const messageIndex = typeof body.messageIndex === "number" ? body.messageIndex : undefined
  const node = asTrimmedString(body.meta?.node, 120)
  const mode = asTrimmedString(body.meta?.mode, 120)
  const move = asTrimmedString(body.meta?.move, 120)

  if (!conversationId) return res.status(400).json({ error: "Missing conversationId" })
  if (!rating) return res.status(400).json({ error: "Invalid rating" })
  if ((rating === "partial" || rating === "negative") && tags.length === 0 && !note) {
    return res.status(400).json({ error: "Feedback requires at least one tag or a note" })
  }

  const index = await readThreadIndex(userKey)
  const allowed =
    conversationId === toLobbyConversationId(userKey) ||
    (index?.threads ?? []).some((thread) => thread.conversation_id === conversationId)

  if (!allowed) return res.status(404).json({ error: "Conversation not found" })

  const stored = await appendFeedback({
    conversationId,
    actorUserKey: userKey,
    revision,
    messageIndex,
    rating,
    tags,
    note: note || undefined,
    meta: {
      node: node || undefined,
      mode: mode || undefined,
      move: move || undefined,
    },
  })

  return res.status(200).json({ ok: true, feedback: stored })
}
