export type ConversationState = {
  conversation_id: string
  revision: number
  active_node: string
  active_node_message: string
  allowed_transitions: string[]
  meta: Record<string, any>
  status: "active" | "paused" | "completed" | "rejected"
  parentese_stack: string[]
}

export type InputSignal =
  | { type: "EXPLICIT_TRANSITION"; target: string }
  | { type: "UI_ACTION"; action: "TLF" | "MAIL" | "AKUT" | "CONTACT_FORM" }
  | { type: "FREE_TEXT"; text: string }
  | { type: "SYSTEM_INIT" }
  | {
      type: "THREAD_CREATE"
      mode: "normal"
    }
  | { type: "THREAD_SWITCH"; conversation_id: string }
  | { type: "THREAD_ARCHIVE" }

export type DeferredJobSignal = {
  pending: true
  job_id: string
  kind: "scan_threads" | "derive_thread_title"
  mode: "shadow" | "visible"
  based_on_revision: number
}

export type KernelResponse = {
  state: ConversationState
  transition?: any
  log?: any
  deferred_job?: DeferredJobSignal | null
}

export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

export type UiSuggestion = {
  id: string
  label: string
  input?: any
}

export type ThreadChoice = {
  id: string
  label: string
  kind: "continue" | "new" | "thread"
}

export type ThreadTab = {
  conversation_id: string
  title: string
  preview: string
  status: "active" | "archived"
  updated_at?: string
}


export type AsyncConversationJob = {
  job_id: string
  kind: "scan_threads" | "derive_thread_title"
  status: "queued" | "running" | "completed" | "failed" | "canceled"
  cursor?: string
  progress?: number
  updated_at?: number
  based_on_revision?: number
  mode?: "shadow" | "visible"
}

export type AsyncDraft = {
  schema_version: "v1"
  job_id: string
  conversation_id: string
  kind: "scan_threads"
  summary_draft: string
  evidence: Array<{
    conversation_id: string
    revision_from?: number
    revision_to?: number
    note?: string
  }>
  open_questions: string[]
  created_at: number
  accepted_at?: number
  accepted_summary?: string
  based_on_revision?: number
  mode?: "shadow" | "visible"
}
