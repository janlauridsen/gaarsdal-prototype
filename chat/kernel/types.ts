export type NodeId = string
export type MetaDomain = string

export type ConversationStatus =
  | "active"
  | "paused"
  | "completed"
  | "rejected"

export type MetaStore = Record<
  MetaDomain,
  { value: unknown; source_node: NodeId }
>

export type ConversationState = {
  conversation_id: string
  revision: number
  active_node: NodeId
  active_node_message: string
  allowed_transitions: NodeId[]
  meta: MetaStore
  status: ConversationStatus
  parentese_stack: NodeId[]
}

export type TransitionType =
  | "NODE_HOP"
  | "AI_TRIAGE"
  | "PAUSE"
  | "RESUME"
  | "PARENTESE_OPEN"
  | "PARENTESE_CLOSE"
  | "TERMINAL"
  | "REJECT"
  | "INIT"

export type Transition = {
  type: TransitionType
  from: NodeId
  to?: NodeId
  reason: string
  response_message?: string
  meta_delta?: Record<MetaDomain, unknown>
}

export type InputSignal =
  | { type: "EXPLICIT_TRANSITION"; target: NodeId }
  | { type: "UI_ACTION"; action: "TLF" | "MAIL" | "AKUT" | "CONTACT_FORM" }
  | { type: "FREE_TEXT"; text: string }
  | {
      type: "FREE_TEXT_RESOLVED"
      proposed_transition: Transition
    }
  | { type: "SYSTEM"; intent: "PAUSE" | "RESUME" | "REJECT" | "TERMINATE" }
  | { type: "SYSTEM_INIT" }

export type LogEvent = {
  conversation_id: string
  revision_before: number
  revision_after: number
  active_node_before: NodeId | null
  active_node_after: NodeId
  input_type: InputSignal["type"]
  transition_type: TransitionType
  timestamp: string
}

export type KernelResult = {
  state: ConversationState
  transition: Transition
  log: LogEvent
}

export type NodeKind =
  | "MENU"
  | "DIALOG"
  | "INFO"
  | "STATIC"
  | "TERMINAL"
  | "ROUTER"
  | "TOOL"
  | "CHECKPOINT"
  | "FORM"

export type FormField = {
  id: string
  label: string
  required?: boolean
  placeholder?: string
}

export type FormSpec = {
  fields: FormField[]
  allow_partial?: boolean
  on_submit_to: NodeId
}

export type RouterSpec = {
  candidates?: NodeId[]
}

export type ToolSpec = {
  name: string
  on_success_to?: NodeId
  on_failure_to?: NodeId
  config?: Record<string, unknown>
}

export type CheckpointSpec = {
  name: string
  on_success_to?: NodeId
  on_failure_to?: NodeId
  config?: Record<string, unknown>
}

export type Node = {
  id: NodeId
  kind: NodeKind
  goal: string
  message: string
  allow_free_text: boolean
  allow_parentese: boolean
  capability_id?: string
  allowed_exits: NodeId[]
  meta_domains_written: string[]
  router?: RouterSpec
  form?: FormSpec
  tool?: ToolSpec
  checkpoint?: CheckpointSpec
}
