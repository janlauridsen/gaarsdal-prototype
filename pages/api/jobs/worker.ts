import type { NextApiRequest, NextApiResponse } from "next"
import { processQueueBatch } from "../../../chat/async/worker"
import { queueSize } from "../../../chat/async/queue"

/**
 * Minimal async worker endpoint.
 *
 * Deploy note:
 * - Run via Vercel Cron or manual dev calls.
 * - Protect with JOB_WORKER_SECRET in production.
 *
 * Usage:
 * - GET /api/jobs/worker?limit=10&secret=...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const configured = process.env.JOB_WORKER_SECRET
  const provided = typeof req.query.secret === "string" ? req.query.secret : ""

  if (configured && provided !== configured) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 10
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 25)) : 10

  const before = await queueSize()
  const batch = await processQueueBatch(limit)
  const after = await queueSize()

  return res.status(200).json({
    ok: true, // boolean success for endpoint
    queue_before: before,
    queue_after: after,
    processed: batch.processed,
    ok_count: batch.ok_count,
    failed: batch.failed,
    dropped: batch.dropped,
    results: batch.results,
  })
}
