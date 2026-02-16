import { getRedisClient } from "./redis"

export type ThreadStatus = "active" | "archived"

export type ThreadItem = {
  conversation_id: string
  title: string
  status: ThreadStatus
  created_at: string
  updated_at: string
}

export type ThreadIndex = {
  version: 1
  user_key: string
  active_conversation_id: string | null
  threads: ThreadItem[]
}

const THREADS_KEY_PREFIX = "gaarsdal:threads:u:"
const MAX_THREADS = 10

function key(userKey: string): string {
  return `${THREADS_KEY_PREFIX}${userKey}`
}

function isThreadItem(value: unknown): value is ThreadItem {
  if (typeof value !== "object" || value === null) return false
  const v = value as any
  return (
    typeof v.conversation_id === "string" &&
    typeof v.title === "string" &&
    (v.status === "active" || v.status === "archived") &&
    typeof v.created_at === "string" &&
    typeof v.updated_at === "string"
  )
}

function isThreadIndex(value: unknown): value is ThreadIndex {
  if (typeof value !== "object" || value === null) return false
  const v = value as any
  return (
    v.version === 1 &&
    typeof v.user_key === "string" &&
    (typeof v.active_conversation_id === "string" || v.active_conversation_id === null) &&
    Array.isArray(v.threads) &&
    v.threads.every(isThreadItem)
  )
}

function parseJson<T>(raw: unknown, guard: (v: unknown) => v is T): T | null {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return guard(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return guard(raw) ? (raw as T) : null
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createEmptyThreadIndex(userKey: string): ThreadIndex {
  return {
    version: 1,
    user_key: userKey,
    active_conversation_id: null,
    threads: [],
  }
}

export async function readThreadIndex(userKey: string): Promise<ThreadIndex | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(key(userKey))
  return parseJson<ThreadIndex>(raw, isThreadIndex)
}

export async function writeThreadIndex(params: {
  userKey: string
  index: ThreadIndex
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(key(params.userKey), JSON.stringify(params.index), { ex: params.ttlSeconds })
}

export async function ensureThreadIndex(params: {
  userKey: string
  ttlSeconds: number
}): Promise<ThreadIndex> {
  const existing = await readThreadIndex(params.userKey)
  if (existing) return existing
  const created = createEmptyThreadIndex(params.userKey)
  await writeThreadIndex({ userKey: params.userKey, index: created, ttlSeconds: params.ttlSeconds })
  return created
}

export function upsertThread(params: {
  index: ThreadIndex
  conversationId: string
  title?: string
  status?: ThreadStatus
}): ThreadIndex {
  const ts = nowIso()
  const title = params.title ?? ""
  const status = params.status ?? "active"
  const existingIdx = params.index.threads.findIndex((t) => t.conversation_id === params.conversationId)

  const nextThreads = [...params.index.threads]
  if (existingIdx >= 0) {
    const prev = nextThreads[existingIdx]
    nextThreads[existingIdx] = {
      ...prev,
      title: title || prev.title,
      status,
      updated_at: ts,
    }
  } else {
    nextThreads.unshift({
      conversation_id: params.conversationId,
      title,
      status,
      created_at: ts,
      updated_at: ts,
    })
  }

  // Keep active threads first, and cap total.
  const active = nextThreads.filter((t) => t.status === "active")
  const archived = nextThreads.filter((t) => t.status === "archived")
  const capped = [...active, ...archived].slice(0, MAX_THREADS)

  // If active_conversation_id was trimmed out, unset it.
  const activeId = params.index.active_conversation_id
  const activeStillExists = activeId ? capped.some((t) => t.conversation_id === activeId) : false

  return {
    ...params.index,
    active_conversation_id: activeStillExists ? activeId : null,
    threads: capped,
  }
}

export function setActiveThread(params: { index: ThreadIndex; conversationId: string | null }): ThreadIndex {
  const ts = nowIso()
  const next = { ...params.index, active_conversation_id: params.conversationId }

  if (!params.conversationId) return next
  const idx = next.threads.findIndex((t) => t.conversation_id === params.conversationId)
  if (idx < 0) return next

  const item = next.threads[idx]
  const updated: ThreadItem = { ...item, updated_at: ts }
  const others = next.threads.filter((t) => t.conversation_id !== params.conversationId)
  return { ...next, threads: [updated, ...others] }
}
