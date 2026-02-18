import type { NextApiRequest, NextApiResponse } from "next"

import { readConversationState } from "../../chat/persistence/conversationStateStore"
import { getRedisClient } from "../../chat/persistence/redis"
import { readConversationEventsV1 } from "../../chat/events/store"
import type { ConversationEventV1 } from "../../chat/events/types"

const INDEX_RECENT_CONVERSATIONS = "gaarsdal:index:conversations:recent" // ZSET
const DEFAULT_LIST_LIMIT = 200
const DEFAULT_EVENT_TAIL = 60

type SessionSummary = {
  conversation_id: string
  kind: "lobby" | "conversation" | "unknown"
  first_at: string | null
  last_at: string | null
  event_count: number
  last_event_type: string | null
  last_node: string | null
  status: string | null
  revision: number | null
}

type SessionDetail = SessionSummary & {
  state: unknown | null
  events: ConversationEventV1[]
}

function toIso(ms: number | null | undefined): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

function kindFromConversationId(conversationId: string): SessionSummary["kind"] {
  if (conversationId.startsWith("lobby:")) return "lobby"
  if (conversationId.startsWith("c:")) return "conversation"
  return "unknown"
}

async function zrevrangeRecentConversationIds(limit: number): Promise<string[]> {
  const client = getRedisClient()
  if (!client) return []

  const anyClient = client as any

  // Upstash API differs slightly across versions; try common variants.
  try {
    // Newer: zrange(key, start, stop, { rev: true })
    const res = await anyClient.zrange(INDEX_RECENT_CONVERSATIONS, 0, limit - 1, { rev: true })
    return Array.isArray(res) ? res.map(String) : []
  } catch {
    // Older: zrevrange(key, start, stop)
    try {
      const res = await anyClient.zrevrange(INDEX_RECENT_CONVERSATIONS, 0, limit - 1)
      return Array.isArray(res) ? res.map(String) : []
    } catch {
      return []
    }
  }
}

async function getEventCount(conversationId: string): Promise<number> {
  const client = getRedisClient()
  if (!client) return 0
  try {
    const key = `gaarsdal:events:v1:${conversationId}`
    const n = await (client as any).llen(key)
    return typeof n === "number" ? n : 0
  } catch {
    return 0
  }
}

function summarize(state: any, events: ConversationEventV1[], count: number, conversationId: string): SessionSummary {
  const first = events.length > 0 ? events[0] : null
  const last = events.length > 0 ? events[events.length - 1] : null
  return {
    conversation_id: conversationId,
    kind: kindFromConversationId(conversationId),
    first_at: toIso(first?.timestamp_ms),
    last_at: toIso(last?.timestamp_ms),
    event_count: count,
    last_event_type: last?.event_type ?? null,
    last_node: typeof state?.active_node === "string" ? state.active_node : (last?.node_id ?? null),
    status: typeof state?.status === "string" ? state.status : null,
    revision: typeof state?.revision === "number" ? state.revision : (typeof last?.revision === "number" ? last.revision : null),
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const conversationId = typeof req.query.conversation_id === "string" ? req.query.conversation_id : null
    const listLimit = Math.max(1, Math.min(Number(req.query.limit ?? DEFAULT_LIST_LIMIT) || DEFAULT_LIST_LIMIT, 500))
    const tailLimit = Math.max(1, Math.min(Number(req.query.tail ?? DEFAULT_EVENT_TAIL) || DEFAULT_EVENT_TAIL, 200))

    // Detail view
    if (conversationId) {
      const [state, events] = await Promise.all([
        readConversationState(conversationId),
        readConversationEventsV1({ conversationId, limit: tailLimit }),
      ])
      const count = await getEventCount(conversationId)
      const summary = summarize(state, events, count, conversationId)
      const detail: SessionDetail = {
        ...summary,
        state,
        events,
      }
      return res.status(200).json(detail)
    }

    // List view
    const ids = await zrevrangeRecentConversationIds(listLimit)

    // Fallback: if index is empty (before PR1 has generated it), use global events list.
    const conversationIds = ids.length
      ? ids
      : (
          await readConversationEventsV1({ limit: listLimit })
        )
          .map((e) => e.conversation_id)
          .filter(Boolean)

    // De-dup while preserving order
    const seen = new Set<string>()
    const unique = conversationIds.filter((id) => {
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    const summaries: SessionSummary[] = []
    for (const id of unique) {
      const [state, events, count] = await Promise.all([
        readConversationState(id),
        readConversationEventsV1({ conversationId: id, limit: Math.min(10, tailLimit) }),
        getEventCount(id),
      ])
      summaries.push(summarize(state, events, count, id))
    }

    // Sort newest-first by last_at (nulls last)
    summaries.sort((a, b) => {
      const at = a.last_at ? new Date(a.last_at).getTime() : 0
      const bt = b.last_at ? new Date(b.last_at).getTime() : 0
      return bt - at
    })

    return res.status(200).json(summaries)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukendt fejl"
    return res.status(500).json({ error: message })
  }
}
