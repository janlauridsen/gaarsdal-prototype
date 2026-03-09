import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { readDraft, readJob, readLatestDraft } from "../../../chat/jobs/store"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "GET, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : ""
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId : ""
  const latest = req.query.latest === "1" || req.query.latest === "true"
  if (!conversationId || (!jobId && !latest)) return res.status(400).json({ error: "Missing conversationId and jobId/latest selector" })

  if (latest) {
    const draft = await readLatestDraft(conversationId)
    if (!draft) return res.status(404).json({ error: "Draft not found" })
    const job = await readJob(draft.job_id)
    if (!job) return res.status(404).json({ error: "Draft not found" })
    if (job.user_key !== userKey || job.conversation_id !== conversationId) return res.status(404).json({ error: "Draft not found" })
    return res.status(200).json(draft)
  }

  const job = await readJob(jobId)
  if (!job) return res.status(404).json({ error: "Draft not found" })
  if (job.user_key !== userKey) return res.status(404).json({ error: "Draft not found" })
  if (job.conversation_id !== conversationId) return res.status(404).json({ error: "Draft not found" })

  const draft = await readDraft(conversationId, jobId)
  if (!draft) return res.status(404).json({ error: "Draft not found" })
  return res.status(200).json(draft)
}
