export type JobKind = "scan_threads"

export type JobStatus = "queued" | "running" | "completed" | "failed" | "canceled"

export type JobMode = "shadow" | "visible"

export type ProblemSpecV1 = {
  schema_version: "v1"
  problem_title: string
  problem_description: string
  topic_tags?: string[]
  time_scope?: string
  search_intent?: string
  confidence?: number
}

export type ScanThreadsLimits = {
  max_threads?: number
  max_threads_deep_dive?: number
  raw_turns_per_thread?: number
}

export type ScanThreadsPayload = {
  problem: ProblemSpecV1
  limits?: ScanThreadsLimits
}

export type JobPayloadByKind = {
  scan_threads: ScanThreadsPayload
}

export type JobRecordV1<K extends JobKind = JobKind> = {
  schema_version: "v1"
  job_id: string
  kind: K
  user_key: string
  conversation_id: string
  status: JobStatus
  cursor: string
  progress: number
  payload: JobPayloadByKind[K]
  result_ref?: string
  last_error?: string
  attempts: number
  created_at: number
  updated_at: number
  based_on_revision: number
  mode: JobMode
  // Opaque internal working state for step-based jobs.
  work?: Record<string, unknown>
}

export type EvidenceRefV1 = {
  conversation_id: string
  revision_from?: number
  revision_to?: number
  note?: string
}

export type DraftV1 = {
  schema_version: "v1"
  job_id: string
  conversation_id: string
  kind: JobKind
  summary_draft: string
  evidence: EvidenceRefV1[]
  open_questions: string[]
  created_at: number
  accepted_at?: number
  accepted_summary?: string
  based_on_revision?: number
  mode?: JobMode
}

export type DeferredJobSignal<K extends JobKind = JobKind> = {
  pending: true
  job_id: string
  kind: K
  mode: JobMode
  based_on_revision: number
}
