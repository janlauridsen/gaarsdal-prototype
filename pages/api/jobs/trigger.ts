import type { NextApiRequest, NextApiResponse } from "next"
import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { jobsTtlSeconds, triggerJob } from "../../../chat/jobs/store"
import { JobKind, ProblemSpecV1, ScanThreadsLimits } from "../../../chat/jobs/types"
import { readThreadIndex } from "../../../chat/persistence/threadIndexStore"
import { toLobbyConversationId } from "../../../chat/utils/conversation"

function isProblemSpecV1(v: any): v is ProblemSpecV1 {
  return (
    v &&
    typeof v === "object" &&
    v.schema_version === "v1" &&
    typeof v.problem_title === "string" &&
    typeof v.problem_description === "string"
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setWidgetCors(req, res, "POST, OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS")
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  const userKey = ensureUserKey(req, res)
  const body = req.body ?? {}
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : ""
  const kind = typeof body.kind === "string" ? (body.kind as JobKind) : ""
  if (!conversationId) return res.status(400).json({ error: "Missing conversationId" })
  if (kind !== "scan_threads") return res.status(400).json({ error: "Unsupported job kind" })

  const idx = await readThreadIndex(userKey)
  const allowed = conversationId === toLobbyConversationId(userKey) || (idx?.threads ?? []).some((t) => t.conversation_id === conversationId)
  if (!allowed) return res.status(404).json({ error: "Conversation not found" })

  const problem = body.problem
  if (!isProblemSpecV1(problem)) return res.status(400).json({ error: "Invalid problem spec" })

  const limitsRaw = body.limits
  const limits: ScanThreadsLimits | undefined =
    limitsRaw && typeof limitsRaw === "object"
      ? {
          max_threads: typeof limitsRaw.max_threads === "number" ? limitsRaw.max_threads : undefined,
          max_threads_deep_dive: typeof limitsRaw.max_threads_deep_dive === "number" ? limitsRaw.max_threads_deep_dive : undefined,
          raw_turns_per_thread: typeof limitsRaw.raw_turns_per_thread === "number" ? limitsRaw.raw_turns_per_thread : undefined,
        }
      : undefined

  const basedOnRevision = typeof body.basedOnRevision === "number" ? body.basedOnRevision : 0
  const ttlSeconds = jobsTtlSeconds()
  const { jobId, deduped } = await triggerJob({
    userKey,
    conversationId,
    kind: "scan_threads",
    payload: { problem, limits },
    ttlSeconds,
    dedupe: true,
    basedOnRevision,
    mode: "shadow",
  })

  if (!jobId) return res.status(500).json({ error: "Jobs not available" })
  return res.status(200).json({ ok: true, jobId, deduped })
}
