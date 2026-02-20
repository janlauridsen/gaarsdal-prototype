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

export type ReturnLink = {
  from: string
  to: string
  created_at: string
  reason?: string
}

export type ThreadIndex = {
  version: 1
  user_key: string
  active_conversation_id: string | null
  threads: ThreadItem[]
  navigation: {
    return_stack: ReturnLink[]
  }
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

  const navigation = (() => {
    const raw = (v as any).navigation
    if (!raw || typeof raw !== "object") return { return_stack: [] as ReturnLink[] }

    const rs = (raw as any).return_stack
    if (!Array.isArray(rs)) return { return_stack: [] as ReturnLink[] }

    const cleaned: ReturnLink[] = rs
      .filter((x: any) => x && typeof x === "object")
      .map((x: any) => ({
        from: typeof x.from === "string" ? x.from : "",
        to: typeof x.to === "string" ? x.to : "",
        created_at: typeof x.created_at === "string" ? x.created_at : "",
        reason: typeof x.reason === "string" ? x.reason : undefined,
      }))
      .filter((x: ReturnLink) => !!x.from && !!x.to && !!x.created_at)

    return { return_stack: cleaned }
  })()

  return {
    version: 1,
    user_key: v.user_key,
    active_conversation_id: v.active_conversation_id,
    threads: (v.threads as any[]).map((t) => normalizeThreadItem(t as any)),
    navigation,
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
    navigation: { return_stack: [] },
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

  const raw = String(params.userText ?? "").trim()
  if (!raw) return params.index

  const truncate = (s: string, max: number): string => {
    if (s.length <= max) return s
    return s.slice(0, max) + "…"
  }

  // Normalize whitespace to avoid title/preview diverging only by spacing.
  const normalized = raw.replace(/\s+/g, " ").trim()

  // Heuristic:
  // - title: first clause/sentence up to a strong delimiter
  // - preview: remainder after the title (avoid duplicate lines in the UI)
  const delimiterRe = /\s*(?:—|--|–|-|:|;|\.|\?|!)\s*/g

  const firstSplit = (() => {
    const m = delimiterRe.exec(normalized)
    delimiterRe.lastIndex = 0
    if (!m) return null
    const idx = m.index
    const delimLen = m[0].length
    return {
      head: normalized.slice(0, idx).trim(),
      tail: normalized.slice(idx + delimLen).trim(),
    }
  })()

  let titleCandidate = firstSplit?.head ?? normalized
  let previewCandidate = firstSplit?.tail ?? ""

  // If the head is too short, fall back to a word-based title.
  if (titleCandidate.length < 12) {
    const words = normalized.split(/\s+/).filter(Boolean)
    titleCandidate = words.slice(0, 8).join(" ")
    previewCandidate = words.slice(8).join(" ").trim()
  }

  const title = truncate(titleCandidate, maxTitleChars)

  // Prefer remainder as preview; if empty, use full text but ensure it differs from title.
  let preview = previewCandidate

  if (!preview) {
    preview = normalized
  }

  // If preview duplicates the title (common for short prompts), drop it.
  if (preview.trim().toLowerCase() === title.trim().toLowerCase()) {
    preview = ""
  } else {
    // If preview still contains the title as prefix (edge cases), drop the overlap.
    const lt = titleCandidate.toLowerCase()
    const lp = preview.toLowerCase()
    if (lp.startsWith(lt) && preview.length > titleCandidate.length) {
      preview = preview.slice(titleCandidate.length).trim()
    }
  }

  preview = truncate(preview, maxPreviewChars)

  return {
    ...params.index,
    threads: params.index.threads.map((t) => {
      if (t.conversation_id !== params.conversationId) return t
      return {
        ...t,
        title,
        preview,
        updated_at: new Date().toISOString(),
      }
    }),
  }
}
