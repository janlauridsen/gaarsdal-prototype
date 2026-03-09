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
      thread_type?: "chat" | "journal"
      journal_profile?: "alcohol" | "general" | "strict"
      journal_init?: {
        title: string
        problem: string
        goal: string
      }
    }
  | { type: "THREAD_SWITCH"; conversation_id: string }
  | { type: "THREAD_ARCHIVE" }

export type KernelResponse = {
  state: ConversationState
  transition?: any
  log?: any
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
  thread_type?: "chat" | "journal"
  journal_profile?: "alcohol" | "general" | "strict"
  // Legacy support (older stored items)
  journal_kind?: "alcohol"
  updated_at?: string
}

export type JournalEntry = {
  entry_id: string
  ts_ms: number
  schema_version: "v1" | "v2"
  kind: "alcohol" | "general" | "strict"
  text?: string
  fields?: {
    drinks?: number
    urge_0_10?: number
    strict_0_10?: number

    // alcohol v2 (optional)
    mood_tag?: string
    mood_0_10?: number
    trigger_tag?: string
    context_tag?: string
    coping_tag?: string
    action?: string
    craving_peak_0_10?: number
    craving_duration_min?: number
  }
}


export type AsyncConversationJob = {
  job_id: string
  kind: "scan_threads"
  status: "queued" | "running" | "completed" | "failed" | "canceled"
  cursor?: string
  progress?: number
  updated_at?: number
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
}
