import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { listPendingJobIds, readJob } from "../../../chat/jobs/store"
import { readThreadIndex } from "../../../chat/persistence/threadIndexStore"
import { toLobbyConversationId } from "../../../chat/utils/conversation"


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "GET, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const conversationId = typeof req.query.conversationId === "string" ? req.query.conversationId : ""
  if (!conversationId) return res.status(400).json({ error: "Missing conversationId" })

  // Access control: conversation must belong to the user.
  const idx = await readThreadIndex(userKey)
  const allowed = conversationId === toLobbyConversationId(userKey) || (idx?.threads ?? []).some((t) => t.conversation_id === conversationId)
  if (!allowed) return res.status(404).json({ error: "Conversation not found" })

  const jobIds = await listPendingJobIds(conversationId, 20)
  const jobs = [] as any[]
  for (const jobId of jobIds) {
    const job = await readJob(jobId)
    if (!job) continue
    if (job.user_key !== userKey) continue
    if (job.conversation_id !== conversationId) continue
    if (job.status === "completed" || job.status === "failed" || job.status === "canceled") continue
    jobs.push({
      job_id: job.job_id,
      kind: job.kind,
      status: job.status,
      cursor: job.cursor,
      progress: job.progress,
      updated_at: job.updated_at,
      based_on_revision: job.based_on_revision,
      mode: job.mode,
    })
  }

  return res.status(200).json({ conversationId, jobs })
}
