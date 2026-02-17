export type EventType =
  // Input lifecycle
  | "input_received"
  | "transition_proposed"
  | "transition_applied"
  | "node_rendered"
  // LLM lifecycle
  | "llm_request"
  | "llm_response"
  // Tool lifecycle
  | "tool_invoked"
  | "tool_completed"
  | "tool_failed"
  // Validation & system
  | "validation_failed"
  | "error_raised"
  // Terminal lifecycle
  | "conversation_completed"
  | "conversation_rejected"
  | "conversation_abandoned"

/**
 * Canonical conversation event envelope (V1).
 *
 * Notes:
 * - schema evolution must be additive.
 * - payload should be structured and stable; avoid raw text unless explicitly enabled.
 */
export type ConversationEventV1 = {
  schema_version: "v1"
  event_id: string
  event_type: EventType

  conversation_id: string
  user_key: string

  /**
   * Monotonic within the conversation. In v23, revision increments per applied kernel result.
   * For V1 we align input_id with the revision_after of the event's turn.
   */
  revision: number
  input_id: number

  node_id?: string

  timestamp_ms: number

  trace_id?: string
  span_id?: string

  payload: unknown
}

export type EventStoreReadParams = {
  userKey?: string
  conversationId?: string
  limit?: number
}
