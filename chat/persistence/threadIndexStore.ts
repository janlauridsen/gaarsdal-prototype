import { getRedisClient } from "./redis"

export type ThreadStatus = "active" | "archived"

export type ThreadItem = {
  conversation_id: string
  title: string
  preview: string
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

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function isThreadItemLoose(value: unknown): value is Omit<ThreadItem, "preview"> & { preview?: unknown } {
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

function isThreadIndexLoose(value: unknown): value is Omit<ThreadIndex, "threads"> & { threads: unknown[] } {
  if (typeof value !== "object" || value === null) return false
  const v = value as any
  return (
    v.version === 1 &&
    typeof v.user_key === "string" &&
    (typeof v.active_conversation_id === "string" || v.active_conversation_id === null) &&
    Array.isArray(v.threads) &&
    v.threads.every(isThreadItemLoose)
  )
}

function normalizeThreadItem(v: Omit<ThreadItem, "preview"> & { preview?: unknown }): ThreadItem {
  return {
    conversation_id: v.conversation_id,
    title: v.title,
    preview: asString((v as any).preview),
    status: v.status,
    created_at: v.created_at,
    updated_at: v.updated_at,
  }
}

function normalizeThreadIndex(value: unknown): ThreadIndex | null {
  if (!isThreadIndexLoose(value)) return null
  const v = value as any
  return {
    version: 1,
    user_key: v.user_key,
    active_conversation_id: v.active_conversation_id,
    threads: (v.threads as any[]).map((t) => normalizeThreadItem(t as any)),
  }
}

function parseJson(raw: unknown): ThreadIndex | null {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return normalizeThreadIndex(parsed)
    } catch {
      return null
    }
  }
  return normalizeThreadIndex(raw)
}

function nowIso(): string {
  return new Date().toISOString()
}

function cleanOneLine(input: string): string {
  return input.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim()
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
  return parseJson(raw)
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
  preview?: string
  status?: ThreadStatus
}): ThreadIndex {
  const ts = nowIso()
  const title = params.title ?? ""
  const preview = params.preview ?? ""
  const status = params.status ?? "active"
  const existingIdx = params.index.threads.findIndex((t) => t.conversation_id === params.conversationId)

  const nextThreads = [...params.index.threads]
  if (existingIdx >= 0) {
    const prev = nextThreads[existingIdx]
    nextThreads[existingIdx] = {
      ...prev,
      title: title || prev.title,
      preview: preview || prev.preview,
      status,
      updated_at: ts,
    }
  } else {
    nextThreads.unshift({
      conversation_id: params.conversationId,
      title,
      preview,
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

export function applyAutoThreadLabelFromText(params: {
  index: ThreadIndex
  conversationId: string
  userText: string
  maxTitleChars?: number
  maxPreviewChars?: number
}): ThreadIndex {
  const maxTitleChars = params.maxTitleChars ?? 60
  const maxPreviewChars = params.maxPreviewChars ?? 120

  const text = cleanOneLine(params.userText)
  if (text.length < 12) return params.index

  const existing = params.index.threads.find((t) => t.conversation_id === params.conversationId)
  const existingTitle = existing?.title ?? ""
  const existingPreview = existing?.preview ?? ""

  // Only label if missing title AND preview.
  if (existingTitle.trim().length > 0 && existingPreview.trim().length > 0) return params.index

  const words = text.split(" ").filter(Boolean)
  const titleCandidate = words.slice(0, 8).join(" ")
  const title = titleCandidate.slice(0, maxTitleChars).trim()
  const preview = text.slice(0, maxPreviewChars).trim()

  return upsertThread({
    index: params.index,
    conversationId: params.conversationId,
    title: existingTitle.trim().length > 0 ? existingTitle : title,
    preview: existingPreview.trim().length > 0 ? existingPreview : preview,
  })
}
