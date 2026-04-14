// pages/api/admin/tick-lookahead.ts
//
// Ticker alle pending anticipate_turn jobs for en given conversationId.
// Bruges af test-runneren for at sikre look-ahead kører synkront inden næste turn.
//
// GET /api/admin/tick-lookahead?token=ADMIN_TOKEN&conversationId=lobby:u:test-xxx

import type { NextApiRequest, NextApiResponse } from "next"
import { tickJob } from "../../../chat/jobs/registry"
import {
  acquireTickLock, isTerminal, jobsTtlSeconds,
  readJob, releaseRunnerLock, releaseTickLock,
  removePending, writeJob
} from "../../../chat/jobs/store"
import { getRedisClient } from "../../../chat/persistence/redis"

const KEY_PREFIX = "gaarsdal:"

function validateToken(req: NextApiRequest, res: NextApiResponse): boolean {
  const token = req.query.token
  const expected = process.env.ADMIN_TOKEN
  if (!expected || token !== expected) {
    res.status(401).json({ error: "Unauthorized" })
    return false
  }
  return true
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateToken(req, res)) return

  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : null
  if (!conversationId) return res.status(400).json({ error: "conversationId påkrævet" })

  const client = getRedisClient()
  if (!client) return res.status(500).json({ error: "Redis ikke tilgængelig" })

  try {
    const pendingKey = `${KEY_PREFIX}jobs:v1:pending:conversation:${conversationId}`
    const jobIds: string[] = await (client as any).zrange(pendingKey, 0, 19)

    const ticked: string[] = []
    const skipped: string[] = []

    for (const jobId of jobIds) {
      const job = await readJob(jobId)
      if (!job || job.kind !== "anticipate_turn") { skipped.push(jobId); continue }
      if (isTerminal(job.status)) { skipped.push(jobId); continue }

      const lockAcquired = await acquireTickLock(jobId)
      if (!lockAcquired) { skipped.push(jobId); continue }

      try {
        const tickResult = await tickJob(job)
        await writeJob(tickResult.job, jobsTtlSeconds)

        if (isTerminal(tickResult.job.status)) {
          await removePending(conversationId, jobId)
          await releaseRunnerLock(conversationId, jobId)
        }
        ticked.push(jobId)
      } finally {
        await releaseTickLock(jobId)
      }
    }

    return res.status(200).json({ conversationId, ticked, skipped, total: jobIds.length })
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message ?? e) })
  }
}
