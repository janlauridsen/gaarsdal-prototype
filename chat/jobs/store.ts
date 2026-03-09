import crypto from "crypto"
import { getRedisClient } from "../persistence/redis"
import { DraftV1, JobKind, JobRecordV1, JobStatus } from "./types"

const KEY_PREFIX = "gaarsdal:jobs:v1:"

const KEY_JOB = (jobId: string) => `${KEY_PREFIX}job:${jobId}`
const KEY_PENDING = (conversationId: string) => `${KEY_PREFIX}pending:conversation:${conversationId}`
const KEY_RUNNER_LOCK = (conversationId: string) => `${KEY_PREFIX}runnerlock:conversation:${conversationId}`
const KEY_TICK_LOCK = (jobId: string) => `${KEY_PREFIX}ticklock:job:${jobId}`
const KEY_DEDUPE = (conversationId: string, kind: JobKind, hash: string) =>
  `${KEY_PREFIX}dedupe:conversation:${conversationId}:${kind}:${hash}`
const KEY_DRAFT = (conversationId: string, jobId: string) => `${KEY_PREFIX}draft:conversation:${conversationId}:${jobId}`
const KEY_DRAFT_LATEST = (conversationId: string) => `${KEY_PREFIX}draft:latest:conversation:${conversationId}`

function nowMs(): number {
  return Date.now()
}

function envInt(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number.parseInt(v.trim(), 10)
  return Number.isFinite(n) ? n : fallback
}

export function jobsTtlSeconds(): number {
  // Keep aligned with raw turn TTL defaults unless overridden.
  const days = envInt("GAARSDAL_JOBS_TTL_DAYS", 14)
  return Math.max(1, days) * 24 * 60 * 60
}

function safeUuid(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
}

function stableHash(input: unknown): string {
  const json = JSON.stringify(input ?? null)
  return crypto.createHash("sha256").update(json).digest("hex").slice(0, 24)
}

function parseJson<T>(raw: unknown): T | null {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }
  if (typeof raw === "object" && raw !== null) return raw as T
  return null
}

export async function readJob(jobId: string): Promise<JobRecordV1 | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(KEY_JOB(jobId))
  const parsed = parseJson<JobRecordV1>(raw)
  if (!parsed || parsed.schema_version !== "v1") return null
  return parsed
}

export async function writeJob(job: JobRecordV1, ttlSeconds: number): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(KEY_JOB(job.job_id), JSON.stringify(job), { ex: ttlSeconds })
}

export async function listPendingJobIds(conversationId: string, limit = 20): Promise<string[]> {
  const client = getRedisClient()
  if (!client) return []
  const safeLimit = Math.max(1, Math.min(limit, 50))
  // zrange 0..N-1
  const ids = await (client as any).zrange(KEY_PENDING(conversationId), 0, safeLimit - 1)
  return (ids ?? []).filter((x: any) => typeof x === "string")
}

export async function addPending(conversationId: string, jobId: string, ttlSeconds: number): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await (client as any).zadd(KEY_PENDING(conversationId), { score: nowMs(), member: jobId })
  await (client as any).expire(KEY_PENDING(conversationId), ttlSeconds)
}

export async function removePending(conversationId: string, jobId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await (client as any).zrem(KEY_PENDING(conversationId), jobId)
}

export async function acquireRunnerLock(conversationId: string, ttlSeconds = 30): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  const ok = await (client as any).set(KEY_RUNNER_LOCK(conversationId), "1", { nx: true, ex: ttlSeconds })
  return Boolean(ok)
}

export async function releaseRunnerLock(conversationId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await (client as any).del(KEY_RUNNER_LOCK(conversationId))
}

export async function acquireTickLock(jobId: string, ttlSeconds = 10): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false
  const ok = await (client as any).set(KEY_TICK_LOCK(jobId), "1", { nx: true, ex: ttlSeconds })
  return Boolean(ok)
}

export async function writeDraft(draft: DraftV1, ttlSeconds: number): Promise<string> {
  const client = getRedisClient()
  if (!client) return ""
  const key = KEY_DRAFT(draft.conversation_id, draft.job_id)
  await client.set(key, JSON.stringify(draft), { ex: ttlSeconds })
  await client.set(KEY_DRAFT_LATEST(draft.conversation_id), draft.job_id, { ex: ttlSeconds })
  return key
}

export async function clearLatestDraft(conversationId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await (client as any).del(KEY_DRAFT_LATEST(conversationId))
}

export async function readDraft(conversationId: string, jobId: string): Promise<DraftV1 | null> {
  const client = getRedisClient()
  if (!client) return null
  const raw = await client.get<unknown>(KEY_DRAFT(conversationId, jobId))
  const parsed = parseJson<DraftV1>(raw)
  if (!parsed || parsed.schema_version !== "v1") return null
  return parsed
}

export async function triggerJob<K extends JobKind>(params: {
  userKey: string
  conversationId: string
  kind: K
  payload: JobRecordV1<K>["payload"]
  ttlSeconds: number
  dedupe?: boolean
}): Promise<{ jobId: string; deduped: boolean }> {
  const client = getRedisClient()
  if (!client) return { jobId: "", deduped: false }

  const ttlSeconds = Math.max(10, params.ttlSeconds)
  const jobId = safeUuid()
  const ts = nowMs()

  if (params.dedupe !== false) {
    const hash = stableHash(params.payload)
    const dedupeKey = KEY_DEDUPE(params.conversationId, params.kind, hash)
    const set = await (client as any).set(dedupeKey, jobId, { nx: true, ex: Math.min(ttlSeconds, 60 * 60) })
    if (!set) {
      // Best effort: return the originally stored jobId if we can.
      const existing = await client.get<string>(dedupeKey)
      return { jobId: typeof existing === "string" ? existing : "", deduped: true }
    }
  }

  const job: JobRecordV1<K> = {
    schema_version: "v1",
    job_id: jobId,
    kind: params.kind,
    user_key: params.userKey,
    conversation_id: params.conversationId,
    status: "queued",
    cursor: "INIT",
    progress: 0,
    payload: params.payload,
    attempts: 0,
    created_at: ts,
    updated_at: ts,
  }

  await writeJob(job as unknown as JobRecordV1, ttlSeconds)
  await addPending(params.conversationId, jobId, ttlSeconds)
  return { jobId, deduped: false }
}

export function isTerminal(status: JobStatus): boolean {
  return status === "completed" || status === "failed" || status === "canceled"
}

export async function readLatestDraft(conversationId: string): Promise<DraftV1 | null> {
  const client = getRedisClient()
  if (!client) return null
  const latestJobId = await client.get<string>(KEY_DRAFT_LATEST(conversationId))
  if (typeof latestJobId !== "string" || !latestJobId.trim()) return null
  return readDraft(conversationId, latestJobId.trim())
}
