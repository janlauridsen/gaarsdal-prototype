import { getRedisClient } from "./redis"
import { nowIso } from "../utils/time"

export type ThreadStatus = "active" | "archived"

export type ThreadItem = {
  conversation_id: string
  title: string
  preview: string
  status: ThreadStatus
  created_at: string
  updated_at: string
  title_confidence?: number
  title_basis_revision?: number
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

function isThreadItemLoose(value: unknown): value is Omit<ThreadItem, "preview" | "title_confidence" | "title_basis_revision"> & { preview?: unknown; title_confidence?: unknown; title_basis_revision?: unknown } {
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

function normalizeThreadItem(v: Omit<ThreadItem, "preview" | "title_confidence" | "title_basis_revision"> & { preview?: unknown; title_confidence?: unknown; title_basis_revision?: unknown }): ThreadItem {
  return {
    conversation_id: v.conversation_id,
    title: v.title,
    preview: asString((v as any).preview),
    status: v.status,
    created_at: v.created_at,
    updated_at: v.updated_at,
    title_confidence: typeof (v as any).title_confidence === "number" ? (v as any).title_confidence : undefined,
    title_basis_revision: typeof (v as any).title_basis_revision === "number" ? (v as any).title_basis_revision : undefined,
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
  titleConfidence?: number
  titleBasisRevision?: number
}): ThreadIndex {
  const ts = nowIso()
  const title = params.title ?? ""
  const preview = params.preview ?? ""
  const status = params.status ?? "active"
  const titleConfidence = typeof params.titleConfidence === "number" ? params.titleConfidence : undefined
  const titleBasisRevision = typeof params.titleBasisRevision === "number" ? params.titleBasisRevision : undefined
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
      title_confidence: titleConfidence ?? prev.title_confidence,
      title_basis_revision: titleBasisRevision ?? prev.title_basis_revision,
    }
  } else {
    nextThreads.unshift({
      conversation_id: params.conversationId,
      title,
      preview,
      status,
      created_at: ts,
      updated_at: ts,
      title_confidence: titleConfidence,
      title_basis_revision: titleBasisRevision,
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

export function isGenericThreadTitle(title: string | null | undefined): boolean {
  const t = asString(title).trim().toLowerCase()
  return !t || t === "ny samtale" || t === "parentesespor"
}

export function updateThreadPreview(params: {
  index: ThreadIndex
  conversationId: string
  previewText: string
  maxPreviewChars?: number
}): ThreadIndex {
  const maxPreviewChars = params.maxPreviewChars ?? 120
  const preview = asString(params.previewText).replace(/\s+/g, " ").trim()
  if (!preview) return params.index
  const nextPreview = preview.length <= maxPreviewChars ? preview : `${preview.slice(0, maxPreviewChars)}…`
  return {
    ...params.index,
    threads: params.index.threads.map((t) =>
      t.conversation_id === params.conversationId
        ? { ...t, preview: nextPreview, updated_at: new Date().toISOString() }
        : t
    ),
  }
}

export function maybePromoteThreadTitle(params: {
  index: ThreadIndex
  conversationId: string
  title: string
  confidence: number
  basisRevision: number
}): ThreadIndex {
  const cleanTitle = asString(params.title).replace(/\s+/g, " ").trim()
  if (!cleanTitle) return params.index

  const thread = params.index.threads.find((t) => t.conversation_id === params.conversationId)
  if (!thread) return params.index

  const currentConfidence = typeof thread.title_confidence === "number" ? thread.title_confidence : 0
  const currentGeneric = isGenericThreadTitle(thread.title)
  const nextConfidence = Math.max(0, Math.min(1, params.confidence))
  const shouldReplace = currentGeneric || (currentConfidence < nextConfidence && params.basisRevision <= 3)
  if (!shouldReplace) return params.index

  return {
    ...params.index,
    threads: params.index.threads.map((t) =>
      t.conversation_id === params.conversationId
        ? {
            ...t,
            title: cleanTitle,
            title_confidence: nextConfidence,
            title_basis_revision: Math.max(0, params.basisRevision),
            updated_at: new Date().toISOString(),
          }
        : t
    ),
  }
}
