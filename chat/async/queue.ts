import crypto from "crypto"
import { getRedisClient } from "../persistence/redis"
import type { AsyncJobV23 } from "./types"

const QUEUE_KEY = "gaarsdal:async:v23:queue"
const DEDUPE_PREFIX = "gaarsdal:async:v23:dedupe:" // {job_id} => 1
const JOB_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

function uuid(): string {
  return (crypto as any).randomUUID
    ? (crypto as any).randomUUID()
    : crypto.randomBytes(16).toString("hex")
}

export function makeJobId(params: {
  type: string
  userKey: string
  episodeId: string
  revisionAfter: number
}): string {
  // Deterministic-ish id to reduce duplicates across retries:
  // type|user|episode|revision
  const raw = `${params.type}|${params.userKey}|${params.episodeId}|${params.revisionAfter}`
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32)
}

export async function enqueueJob(job: Omit<AsyncJobV23, "job_id" | "created_at_ms"> & { job_id?: string }): Promise<string> {
  const client = getRedisClient()
  if (!client) return "redis-disabled"

  const job_id = job.job_id ?? makeJobId({
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

export async function dequeueJobs(limit: number): Promise<AsyncJobV23[]> {
  const client = getRedisClient()
  if (!client) return []

  const n = Math.max(1, Math.min(limit, 50))
  const out: AsyncJobV23[] = []

  // Simple list-pop; good enough for v23. (Later: streams, visibility timeouts.)
  for (let i = 0; i < n; i++) {
    const raw = await client.lpop<string>(QUEUE_KEY)
    if (!raw) break
    try {
      const parsed = JSON.parse(raw) as AsyncJobV23
      if (parsed && parsed.schema_version === "v23" && typeof parsed.job_id === "string") out.push(parsed)
    } catch {
      // drop bad item
    }
  }

  return out
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
