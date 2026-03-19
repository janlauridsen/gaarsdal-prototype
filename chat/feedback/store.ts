import { getRedisClient } from "../persistence/redis"

export type FeedbackRating = "positive" | "partial" | "negative"

export type FeedbackTag =
  | "helpful"
  | "too_interpretive"
  | "too_directive"
  | "too_generic"
  | "not_concrete"
  | "misunderstood"
  | "too_reflective"
  | "other"

export type FeedbackEvent = {
  ts: string
  conversation_id: string
  revision?: number
  message_index?: number
  actor_user_key: string
  rating: FeedbackRating
  tags: FeedbackTag[]
  note?: string
  meta?: {
    node?: string
    mode?: string
    move?: string
  }
}

const ALL_KEY = "gaarsdal:feedback:all"
const CONV_KEY_PREFIX = "gaarsdal:feedback:conversation:"
const MAX_ITEMS = 2000
const DEFAULT_TTL_SECONDS = 90 * 24 * 60 * 60

function conversationKey(conversationId: string): string {
  return `${CONV_KEY_PREFIX}${conversationId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export function feedbackTtlSeconds(): number {
  return DEFAULT_TTL_SECONDS
}

export async function appendFeedback(params: {
  conversationId: string
  actorUserKey: string
  revision?: number
  messageIndex?: number
  rating: FeedbackRating
  tags?: FeedbackTag[]
  note?: string
  meta?: FeedbackEvent["meta"]
  ttlSeconds?: number
}): Promise<FeedbackEvent | null> {
  const client = getRedisClient()
  if (!client) return null

  const tags = Array.isArray(params.tags) ? params.tags.filter(Boolean).slice(0, 8) : []
  const ttlSeconds = typeof params.ttlSeconds === "number" ? params.ttlSeconds : feedbackTtlSeconds()

  const event: FeedbackEvent = {
    ts: nowIso(),
    conversation_id: params.conversationId,
    revision: typeof params.revision === "number" ? params.revision : undefined,
    message_index: typeof params.messageIndex === "number" ? params.messageIndex : undefined,
    actor_user_key: params.actorUserKey,
    rating: params.rating,
    tags,
    note: typeof params.note === "string" ? params.note : undefined,
    meta: params.meta && typeof params.meta === "object" ? params.meta : undefined,
  }

  const payload = JSON.stringify(event)
  await client.rpush(ALL_KEY, payload)
  await client.ltrim(ALL_KEY, -MAX_ITEMS, -1)
  await client.expire(ALL_KEY, ttlSeconds)

  const convKey = conversationKey(params.conversationId)
  await client.rpush(convKey, payload)
  await client.ltrim(convKey, -MAX_ITEMS, -1)
  await client.expire(convKey, ttlSeconds)

  return event
}
