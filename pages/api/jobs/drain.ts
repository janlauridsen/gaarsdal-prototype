// pages/api/jobs/drain.ts
//
// Dedikeret job-drainer med global Redis-semaphore.
// Forhindrer at flere Vercel-instanser processer jobs simultant.
//
// Bruges af:
//   - chat.ts via waitUntil (erstatter processQueueBatch direkte)
//   - test-runner via GET /api/jobs/drain?token=...&conversationId=...
//
// GET /api/jobs/drain?token=ADMIN_TOKEN&conversationId=lobby:u:xxx
// POST /api/jobs/drain  (intern, fra chat.ts waitUntil)

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { processQueueBatch } from "../../../chat/async/worker"
import { tickJob } from "../../../chat/jobs/registry"
import {
  acquireTickLock,
  isTerminal,
  jobsTtlSeconds,
  listPendingJobIds,
  readJob,
  releaseRunnerLock,
  releaseTickLock,
  removePending,
  writeJob,
} from "../../../chat/jobs/store"

export const config = { maxDuration: 60 }

// ── Global semaphore ──────────────────────────────────────────────────────────
// Forhindrer concurrent drain-runs på tværs af alle Vercel-instanser.
// TTL på 50s sikrer at låsen aldrig sidder fast (maxDuration er 60s).
const SEMAPHORE_KEY = "gaarsdal:jobs:drain:semaphore"
const SEMAPHORE_TTL = 50

async function acquireSemaphore(instanceId: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return true // redis-disabled: lad det køre
  const ok = await (client as any).set(SEMAPHORE_KEY, instanceId, { nx: true, ex: SEMAPHORE_TTL })
  return Boolean(ok)
}

async function releaseSemaphore(instanceId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  // Kun release hvis vi ejer låsen (undgår at slette en andens lås)
  const current = await client.get<string>(SEMAPHORE_KEY)
  if (current === instanceId) {
    await (client as any).del(SEMAPHORE_KEY)
  }
}

// ── Anticipate-job tick ───────────────────────────────────────────────────────
async function drainAnticipateJobs(conversationId: string): Promise<{ ticked: string[]; skipped: string[] }> {
  const ticked: string[] = []
  const skipped: string[] = []

  const jobIds = await listPendingJobIds(conversationId, 10)
  for (const jobId of jobIds) {
    const job = await readJob(jobId)
    if (!job || job.kind !== "anticipate_turn") { skipped.push(jobId); continue }
    if (isTerminal(job.status)) { skipped.push(jobId); continue }

    const lockAcquired = await acquireTickLock(jobId)
    if (!lockAcquired) { skipped.push(jobId); continue }

    try {
      // Loop ticks until terminal — job needs 3 ticks (INIT→SIMULATE→BUILD_INSTRUCTION→DONE)
      let current = job
      while (!isTerminal(current.status)) {
        const tickResult = await tickJob(current)
        current = tickResult.job
        await writeJob(current, jobsTtlSeconds())
        if (isTerminal(current.status)) {
          await removePending(conversationId, jobId)
          await releaseRunnerLock(conversationId)
        }
      }
      ticked.push(jobId)
    } finally {
      await releaseTickLock(jobId)
    }
  }

  return { ticked, skipped }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminToken = process.env.ADMIN_TOKEN
  const token = req.query.token ?? (req.body as any)?.token
  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : (typeof (req.body as any)?.conversationId === "string" ? (req.body as any).conversationId : null)

  // Auth: kræves for GET, valgfri for intern POST fra chat.ts (ingen token)
  if (req.method === "GET" && (!adminToken || token !== adminToken)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const acquired = await acquireSemaphore(instanceId)

  if (!acquired) {
    // En anden instans drainer allerede — returner straks
    return res.status(200).json({ status: "busy", message: "Drain allerede i gang på anden instans" })
  }

  try {
    const results: Record<string, unknown> = {}

    // 1. Drain SUMMARIZE_EPISODE / SUGGEST_FACTS jobs (async queue)
    const batchResult = await processQueueBatch(3)
    results.async_batch = batchResult

    // 2. Drain anticipate_turn jobs for specifik samtale (hvis angivet)
    if (conversationId) {
      const anticipateResult = await drainAnticipateJobs(conversationId)
      results.anticipate = anticipateResult
    }

    return res.status(200).json({ status: "ok", instanceId, ...results })
  } finally {
    await releaseSemaphore(instanceId)
  }
}
