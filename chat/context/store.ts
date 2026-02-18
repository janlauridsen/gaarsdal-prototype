import crypto from "crypto"

import { getRedisClient } from "../persistence/redis"
import type { EvidenceTagged, TherapeuticContextEnvelope } from "./types"

const KEY_PREFIX = "gaarsdal:context:conversation:"

function key(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  if (typeof raw === "object") return raw as T
  return null
}

function newId(): string {
  return (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex")
}

function defaultEnvelope(params: {
  conversationId: string
  userKey: string
}): TherapeuticContextEnvelope {
  return {
    schemaVersion: "therapeutic-context@1.0.0",
    conversationId: params.conversationId,
    userKey: params.userKey,
    updatedAt: nowIso(),
    fields: {},
  }
}

export async function readTherapeuticContext(params: {
  conversationId: string
}): Promise<TherapeuticContextEnvelope | null> {
  const client = getRedisClient()
  if (!client) return null

  const raw = await client.get<unknown>(key(params.conversationId))
  return parseJson<TherapeuticContextEnvelope>(raw)
}

export type UpsertFieldInput = {
  path: string
  value: unknown
  evidence: { source: EvidenceTagged<unknown>["evidence"]["source"]; turn_id?: string; method?: string }
  confidence: number
  freshness?: { last_confirmed_at?: string; valid_until?: string }
}

export async function upsertTherapeuticContext(params: {
  conversationId: string
  userKey: string
  ttlSeconds: number
  updates: UpsertFieldInput[]
}): Promise<TherapeuticContextEnvelope | null> {
  const client = getRedisClient()
  if (!client) return null

  const existing = await readTherapeuticContext({ conversationId: params.conversationId })
  const envelope =
    existing ?? defaultEnvelope({ conversationId: params.conversationId, userKey: params.userKey })

  // Keep userKey stable (in case of legacy payloads)
  envelope.userKey = params.userKey

  const now = nowIso()

  for (const u of params.updates) {
    if (!u || typeof u.path !== "string" || !u.path.trim()) continue

    const prev = envelope.fields[u.path]
    if (prev && prev.status === "ACTIVE") {
      prev.status = "SUPERSEDED"
      prev.superseded_by = prev.superseded_by ?? null // ensure key exists
    }

    const id = newId()
    if (prev && prev.status === "SUPERSEDED") {
      prev.superseded_by = id
    }

    envelope.fields[u.path] = {
      id,
      path: u.path,
      value: u.value,
      evidence: {
        source: u.evidence.source,
        turn_id: u.evidence.turn_id,
        method: u.evidence.method,
      },
      confidence: clamp01(u.confidence),
      freshness: {
        first_observed_at: prev?.freshness?.first_observed_at ?? now,
        last_confirmed_at: u.freshness?.last_confirmed_at ?? now,
        valid_until: u.freshness?.valid_until,
      },
      status: "ACTIVE",
      superseded_by: null,
    }
  }

  envelope.updatedAt = now

  await client.set(key(params.conversationId), JSON.stringify(envelope), { ex: params.ttlSeconds })
  return envelope
}
