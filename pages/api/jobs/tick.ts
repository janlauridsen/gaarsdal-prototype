import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { acquireTickLock, isTerminal, jobsTtlSeconds, readJob, releaseRunnerLock, releaseTickLock, removePending, writeJob } from "../../../chat/jobs/store"
import { tickJob } from "../../../chat/jobs/registry"

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

  if (isTerminal(job.status)) {
    // Ensure pending removed.
    await removePending(job.conversation_id, job.job_id)
    await releaseRunnerLock(job.conversation_id)
    return res.status(200).json({
      jobId: job.job_id,
      status: job.status,
      cursor: job.cursor,
      progress: job.progress,
      resultRef: job.result_ref,
      lastError: job.last_error ?? null,
    })
  }

  const locked = await acquireTickLock(job.job_id, 10)
  if (!locked) {
    return res.status(200).json({
      jobId: job.job_id,
      status: job.status,
      cursor: job.cursor,
      progress: job.progress,
      resultRef: job.result_ref,
      lastError: job.last_error ?? null,
      busy: true,
    })
  }

  try {
    const { job: updated, completed } = await tickJob(job)
    const ttlSeconds = jobsTtlSeconds()
    await writeJob(updated, ttlSeconds)

    if (completed || isTerminal(updated.status)) {
      await removePending(updated.conversation_id, updated.job_id)
      await releaseRunnerLock(updated.conversation_id)
    }

    return res.status(200).json({
      jobId: updated.job_id,
      status: updated.status,
      cursor: updated.cursor,
      progress: updated.progress,
      resultRef: updated.result_ref,
      lastError: updated.last_error ?? null,
    })
  } finally {
    await releaseTickLock(job.job_id)
  }
}
