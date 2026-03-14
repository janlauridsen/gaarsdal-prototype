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

  const active = nextThreads.filter((t) => t.status === "active")
  const archived = nextThreads.filter((t) => t.status === "archived")
  const capped = [...active, ...archived].slice(0, MAX_THREADS)

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

export function archiveThread(params: { index: ThreadIndex; conversationId: string }): ThreadIndex {
  const ts = nowIso()
  const conversationId = params.conversationId

  const exists = params.index.threads.some((t) => t.conversation_id === conversationId)
  if (!exists) return params.index

  const threads = params.index.threads.map((t) =>
    t.conversation_id === conversationId
      ? {
          ...t,
          status: "archived" as ThreadStatus,
          updated_at: ts,
        }
      : t
  )

  const return_stack = (params.index.navigation?.return_stack ?? []).filter(
    (l) => l.from !== conversationId && l.to !== conversationId
  )

  const activeWasArchived = params.index.active_conversation_id === conversationId
  const nextActiveId = activeWasArchived
    ? (threads.find((t) => t.status === "active" && t.conversation_id !== conversationId)?.conversation_id ?? null)
    : params.index.active_conversation_id

  const active = threads.filter((t) => t.status === "active")
  const archived = threads.filter((t) => t.status === "archived")
  const capped = [...active, ...archived].slice(0, MAX_THREADS)

  const activeStillExists = nextActiveId ? capped.some((t) => t.conversation_id === nextActiveId) : false

  return {
    ...params.index,
    active_conversation_id: activeStillExists ? nextActiveId : null,
    threads: capped,
    navigation: { return_stack },
  }
}

export function applyAutoThreadLabelFromText(params: {
  index: ThreadIndex
  conversationId: string
  titleText: string
  previewText: string
  maxTitleChars?: number
  maxPreviewChars?: number
  setTitleIfEmpty?: boolean
  alwaysUpdatePreview?: boolean
}): ThreadIndex {
  const maxTitleChars = params.maxTitleChars ?? 60
  const maxPreviewChars = params.maxPreviewChars ?? 120
  const setTitleIfEmpty = params.setTitleIfEmpty ?? true
  const alwaysUpdatePreview = params.alwaysUpdatePreview ?? true

  const truncate = (s: string, max: number): string => {
    const t = String(s ?? "").trim()
    if (!t) return ""
    if (t.length <= max) return t
    return t.slice(0, max) + "…"
  }

  const normalize = (s: string): string => String(s ?? "").replace(/\s+/g, " ").trim()

  const STOPWORDS = new Set<string>([
    "og","i","på","af","for","til","med","det","den","de","der","som","en","et","er","var","har","have","skal","kan",
    "jeg","du","vi","man","mig","din","mit","dine","min","mine","jer","os","sig","sin","sine","sit",
    "ikke","så","også","mere","meget","lidt","bare","kun","når","hvis","fordi","men","eller","da",
    "and","or","the","a","an","to","of","in","on","for","with","is","are","was","were","be","been","being",
    "i","you","we","they","it","this","that","these","those","my","your","our","their","me","us",
    "not","so","also","more","most","very","just","only","when","if","because","but",
  ])

  const tokenize = (s: string): string[] => {
    const cleaned = normalize(s)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]+/gu, " ")
      .replace(/[_-]+/g, " ")
      .trim()
    if (!cleaned) return []
    return cleaned.split(/\s+/).filter(Boolean)
  }

  const keywordTitle = (s: string): string => {
    const tokens = tokenize(s).filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    if (!tokens.length) {
      return truncate(normalize(s).split(/\s+/).slice(0, 8).join(" "), maxTitleChars)
    }

    const freq = new Map<string, number>()
    for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1)

    const firstPos = new Map<string, number>()
    tokens.forEach((t, idx) => {
      if (!firstPos.has(t)) firstPos.set(t, idx)
    })

    const uniq = Array.from(freq.keys())
    uniq.sort((a, b) => {
      const fa = freq.get(a) ?? 0
      const fb = freq.get(b) ?? 0
      if (fb !== fa) return fb - fa
      if (b.length !== a.length) return b.length - a.length
      return (firstPos.get(a) ?? 0) - (firstPos.get(b) ?? 0)
    })

    const picked: string[] = []
    for (const k of uniq) {
      const next = [...picked, k].join(" ")
      if (picked.length >= 6) break
      if (next.length > maxTitleChars) break
      picked.push(k)
      if (picked.length >= 4 && next.length >= Math.floor(maxTitleChars * 0.6)) break
    }

    const title = picked.join(" ").trim()
    return truncate(title || normalize(s), maxTitleChars)
  }

  const titleText = normalize(params.titleText)
  const previewText = normalize(params.previewText)

  const idx = params.index
  const thread = idx.threads.find((t) => t.conversation_id === params.conversationId)
  if (!thread) return idx

  const nextThreads = idx.threads.map((t) => {
    if (t.conversation_id !== params.conversationId) return t

    const nextTitle =
      (!setTitleIfEmpty || !(t.title ?? "").trim()) && titleText
        ? keywordTitle(titleText)
        : (t.title ?? "")

    const nextPreview = alwaysUpdatePreview && previewText ? truncate(previewText, maxPreviewChars) : (t.preview ?? "")

    return {
      ...t,
      title: nextTitle,
      preview: nextPreview,
      updated_at: new Date().toISOString(),
    }
  })

  return { ...idx, threads: nextThreads }
}
