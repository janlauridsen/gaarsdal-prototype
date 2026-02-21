import crypto from "crypto"
import { getRedisClient } from "../persistence/redis"
import type { AsyncJobV23 } from "./types"

const QUEUE_KEY = "gaarsdal:async:v23:queue"
const DEDUPE_PREFIX = "gaarsdal:async:v23:dedupe:" // {job_id} => 1
const JOB_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

function uuid(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
}

export function makeJobId(params: { type: string; userKey: string; episodeId: string; revisionAfter: number }): string {
  const raw = `${params.type}|${params.userKey}|${params.episodeId}|${params.revisionAfter}`
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32)
}

export async function enqueueJob(
  job: Omit<AsyncJobV23, "job_id" | "created_at_ms"> & { job_id?: string }
): Promise<string> {
  const client = getRedisClient()
  if (!client) return "redis-disabled"

  const job_id =
    job.job_id ??
    makeJobId({
      type: job.type,
      userKey: job.user_key,
      episodeId: job.episode_id,
      revisionAfter: job.revision_after,
    })

  // Dedupe: if we've seen this job_id recently, no-op.
  const dedupeKey = `${DEDUPE_PREFIX}${job_id}`
  const already = await client.get(dedupeKey)
  if (already) return job_id

  const full: AsyncJobV23 = {
    schema_version: "v23",
    job_id,
    created_at_ms: Date.now(),
    ...job,
  }

  await client.set(dedupeKey, "1", { ex: JOB_TTL_SECONDS })
  await client.rpush(QUEUE_KEY, JSON.stringify(full))
  return job_id
}

function looksLikeJobObject(v: any): v is Partial<AsyncJobV23> {
  if (!v || typeof v !== "object") return false
  return typeof v.type === "string" && typeof v.user_key === "string" && typeof v.conversation_id === "string"
}

function normalizeLegacyToV23(parsed: any): AsyncJobV23 | null {
  // Accept legacy objects that were enqueued without schema_version but still have the core routing fields.
  if (!looksLikeJobObject(parsed)) return null
  if (typeof parsed.job_id !== "string") return null

  const schema_version = parsed.schema_version === "v23" ? "v23" : "v23"

  return {
    schema_version,
    job_id: parsed.job_id,
    type: parsed.type,
    user_key: parsed.user_key,
    conversation_id: parsed.conversation_id,
    theme_id: typeof parsed.theme_id === "string" ? parsed.theme_id : "unknown",
    episode_id: typeof parsed.episode_id === "string" ? parsed.episode_id : "unknown",
    revision_after: typeof parsed.revision_after === "number" ? parsed.revision_after : 0,
    created_at_ms: typeof parsed.created_at_ms === "number" ? parsed.created_at_ms : Date.now(),
    job_version: typeof parsed.job_version === "number" ? parsed.job_version : 0,
    payload: parsed.payload,
  }
}

export async function dequeueJobsWithStats(limit: number): Promise<{ jobs: AsyncJobV23[]; dropped: number }> {
  const client = getRedisClient()
  if (!client) return { jobs: [], dropped: 0 }

  const n = Math.max(1, Math.min(limit, 50))
  const jobs: AsyncJobV23[] = []
  let dropped = 0

  for (let i = 0; i < n; i++) {
    const raw = await client.lpop<string>(QUEUE_KEY)
    if (!raw) break

    try {
      const parsed = JSON.parse(raw)
      // v23 exact match
      if (parsed && parsed.schema_version === "v23" && typeof parsed.job_id === "string") {
        jobs.push(parsed as AsyncJobV23)
        continue
      }

      // Legacy normalization
      const normalized = normalizeLegacyToV23(parsed)
      if (normalized) {
        jobs.push(normalized)
        continue
      }

      dropped++
    } catch {
      dropped++
    }
  }

  return { jobs, dropped }
}

// Backward compatible export (existing callers)
export async function dequeueJobs(limit: number): Promise<AsyncJobV23[]> {
  const { jobs } = await dequeueJobsWithStats(limit)
  return jobs
}

export async function queueSize(): Promise<number> {
  const client = getRedisClient()
  if (!client) return 0
  const len = await client.llen(QUEUE_KEY)
  return typeof len === "number" ? len : 0
}

export function newEphemeralJobId(): string {
  return uuid()
}
