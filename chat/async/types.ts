export type AsyncJobType = "SUMMARIZE_EPISODE" | "SUGGEST_FACTS"

export type AsyncJobV23 = {
  schema_version: "v23"
  job_id: string
  type: AsyncJobType

  // routing
  user_key: string
  conversation_id: string

  // purpose
  theme_id: string
  episode_id: string

  // correlation / idempotency
  revision_after: number
  created_at_ms: number

  // versioning for job logic changes
  job_version: number
}

export type AsyncJobResult = {
  job_id: string
  ok: boolean
  error?: { code: string; message: string }
}
