import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"

import { ensureUserKey } from "../_utils/auth"
import { setWidgetCors } from "../_utils/cors"
import { clearLatestDraft, readDraft, readJob, jobsTtlSeconds, writeDraft } from "../../../chat/jobs/store"
import { ensureThreadThemeAndEpisode, upsertEpisode } from "../../../chat/memory/longTermMemoryStore"
import { appendSpineEventV23 } from "../../../chat/observability/spineStore"
import { readConversationState } from "../../../chat/persistence/conversationStateStore"

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === "string").map((x) => String(x).trim()).filter(Boolean)
}

function clampText(input: string, max = 4000): string {
  return input.replace(/\r\n?/g, "\n").trim().slice(0, max)
}

function uniqueStrings(values: string[], max = 10): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const key = value.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(value.trim())
    if (out.length >= max) break
  }
  return out
}

function safeId(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
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
  const conversationId = asString(body.conversationId)
  const jobId = asString(body.jobId)
  const accepted = body.accepted !== false

  if (!conversationId || !jobId) {
    return res.status(400).json({ error: "Missing conversationId or jobId" })
  }
  if (!accepted) {
    return res.status(400).json({ error: "Only accepted=true is supported in this endpoint" })
  }

  const job = await readJob(jobId)
  if (!job || job.user_key !== userKey || job.conversation_id !== conversationId) {
    return res.status(404).json({ error: "Job not found" })
  }
  if (job.status !== "completed") {
    return res.status(409).json({ error: "Job is not completed" })
  }

  const draft = await readDraft(conversationId, jobId)
  if (!draft) return res.status(404).json({ error: "Draft not found" })

  const acceptedSummary = clampText(asString(body.summary) || draft.summary_draft)
  if (!acceptedSummary) {
    return res.status(400).json({ error: "Accepted summary is empty" })
  }

  const openLoops = uniqueStrings(asStringArray(body.open_questions).length > 0 ? asStringArray(body.open_questions) : draft.open_questions)
  const ttlSeconds = jobsTtlSeconds()
  const { episode } = await ensureThreadThemeAndEpisode({
    userKey,
    conversationId,
    ttlSeconds,
  })

  const now = Date.now()
  const updatedEpisode = {
    ...episode,
    summary_short: acceptedSummary,
    open_loops: openLoops.length > 0 ? openLoops : undefined,
    updated_at: now,
  }

  await upsertEpisode({
    userKey,
    episode: updatedEpisode,
    ttlSeconds,
  })

  await writeDraft(
    {
      ...draft,
      accepted_at: now,
      accepted_summary: acceptedSummary,
      open_questions: openLoops,
    },
    ttlSeconds
  )
  await clearLatestDraft(conversationId)

  const state = await readConversationState(conversationId)
  const revision = typeof state?.revision === "number" ? state.revision : 0
  await appendSpineEventV23({
    schema_version: "v23",
    event_id: safeId(),
    user_key: userKey,
    conversation_id: conversationId,
    revision_before: revision,
    revision_after: revision,
    node_before: state?.active_node ?? null,
    node_after: state?.active_node ?? "SYSTEM_JOB_ACCEPT",
    status_after: state?.status ?? "active",
    input_type: "UI_ACTION",
    transition_type: "JOB_DRAFT_ACCEPTED",
    meta_domains_written: ["memory.episode"],
    meta_keys_written: ["episode.summary_short", "episode.open_loops"],
  })

  return res.status(200).json({
    ok: true,
    conversationId,
    jobId,
    episodeId: updatedEpisode.episode_id,
    summary_short: updatedEpisode.summary_short,
    open_loops: updatedEpisode.open_loops ?? [],
    accepted_at: now,
  })
}
