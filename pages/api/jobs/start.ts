import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { acquireRunnerLock, jobsTtlSeconds, readJob, releaseRunnerLock, removePending, writeJob } from "../../../chat/jobs/store"
import { readConversationState } from "../../../chat/persistence/conversationStateStore"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "POST, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId : ""
  const requestedRevision = typeof req.body?.basedOnRevision === "number" ? req.body.basedOnRevision : null
  if (!jobId) return res.status(400).json({ error: "Missing jobId" })

  const job = await readJob(jobId)
  if (!job) return res.status(404).json({ error: "Job not found" })
  if (job.user_key !== userKey) return res.status(404).json({ error: "Job not found" })

  if (job.status === "completed" || job.status === "failed" || job.status === "canceled") {
    return res.status(200).json({ status: job.status })
  }

  const currentState = await readConversationState(job.conversation_id)
  const currentRevision = typeof currentState?.revision === "number" ? currentState.revision : 0
  const isStale = currentRevision > job.based_on_revision || (requestedRevision !== null && requestedRevision !== job.based_on_revision)
  if (isStale) {
    const ttlSeconds = jobsTtlSeconds()
    const staleJob = {
      ...job,
      status: "canceled" as const,
      last_error: `stale_job: current_revision=${currentRevision}, job_revision=${job.based_on_revision}`,
      updated_at: Date.now(),
    }
    await writeJob(staleJob, ttlSeconds)
    await removePending(job.conversation_id, job.job_id)
    await releaseRunnerLock(job.conversation_id)
    return res.status(200).json({ status: "canceled", stale: true, currentRevision, basedOnRevision: job.based_on_revision })
  }

  const locked = await acquireRunnerLock(job.conversation_id, 30)
  if (!locked) return res.status(200).json({ status: "busy" })

  // Transition queued -> running is handled by first tick; keep start idempotent.
  const ttlSeconds = jobsTtlSeconds()
  const next = { ...job, updated_at: Date.now() }
  await writeJob(next, ttlSeconds)
  return res.status(200).json({ status: next.status, basedOnRevision: next.based_on_revision, mode: next.mode })
}
