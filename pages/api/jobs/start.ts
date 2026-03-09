import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { acquireRunnerLock, jobsTtlSeconds, readJob, writeJob } from "../../../chat/jobs/store"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "POST, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : ""
  if (!jobId) return res.status(400).json({ error: "Missing jobId" })

  const job = await readJob(jobId)
  if (!job) return res.status(404).json({ error: "Job not found" })
  if (job.user_key !== userKey) return res.status(404).json({ error: "Job not found" })

  if (job.status === "completed" || job.status === "failed" || job.status === "canceled") {
    return res.status(200).json({ status: job.status })
  }

  const locked = await acquireRunnerLock(job.conversation_id, 30)
  if (!locked) return res.status(200).json({ status: "busy" })

  // Transition queued -> running is handled by first tick; keep start idempotent.
  const ttlSeconds = jobsTtlSeconds()
  const next = { ...job, updated_at: Date.now() }
  await writeJob(next, ttlSeconds)
  return res.status(200).json({ status: next.status })
}
