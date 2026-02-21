import type { NextApiRequest, NextApiResponse } from "next"
import { processQueueBatch } from "../../../chat/async/worker"
import { queueSize } from "../../../chat/async/queue"

/**
 * Minimal async worker endpoint.
 *
 * Deploy note:
 * - Run via Vercel Cron or manual dev calls.
 * - Secure with CRON_SECRET (Vercel sends Authorization: Bearer <CRON_SECRET>) or JOB_WORKER_SECRET.
 *
 * Usage:
 * - GET /api/jobs/worker?limit=10
 * - Optional legacy: GET /api/jobs/worker?limit=10&secret=...
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const cronSecret = process.env.CRON_SECRET
  const jobSecret = process.env.JOB_WORKER_SECRET

  const authHeader = typeof req.headers.authorization === "string" ? req.headers.authorization : ""
  const providedQuerySecret = typeof req.query.secret === "string" ? req.query.secret : ""

  const cronOk = cronSecret ? authHeader === `Bearer ${cronSecret}` : false
  const jobOk = jobSecret
    ? authHeader === `Bearer ${jobSecret}` || providedQuerySecret === jobSecret
    : false

  // If any secret is configured, require a match.
  if ((cronSecret || jobSecret) && !(cronOk || jobOk)) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 10
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 25)) : 10

  const before = await queueSize()
  const batch = await processQueueBatch(limit)
  const after = await queueSize()

  return res.status(200).json({
    ok: true,
    queue_before: before,
    queue_after: after,
    ...batch,
  })
}
