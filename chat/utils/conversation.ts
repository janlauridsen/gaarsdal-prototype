import type { InputSignal } from "../kernel/types"

export function isLobbyConversation(id: string): boolean {
  return id.startsWith("lobby:u:")
}

export function toLobbyConversationId(userKey: string): string {
  return `lobby:u:${userKey}`
}

export function isControlInput(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return true
  if (t === "continue" || t === "fortsæt" || t === "fortsaet") return true
  if (t === "new" || t === "ny") return true
  if (t.startsWith("c:")) return true
  return false
}

export function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return (input as any).text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${(input as any).target}`
  if (input.type === "UI_ACTION") return `UI_ACTION:${(input as any).action}`
  if (input.type === "SYSTEM") return `SYSTEM:${(input as any).intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

export function truncateText(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max) + "…"
}

export function withThreadMeta(state: any, index: any): any {
  const threads = Array.isArray(index?.threads) ? index.threads : []
  const tabs = threads
    .filter((t: any) => t && typeof t.conversation_id === "string" && t.status === "active")
    .map((t: any) => ({
      conversation_id: t.conversation_id,
      title: typeof t.title === "string" ? t.title : "",
      preview: typeof t.preview === "string" ? t.preview : "",
      status: "active" as const,
      updated_at: t.updated_at,
    }))
  const activeId =
    (typeof index?.active_conversation_id === "string"
      ? index.active_conversation_id
      : state?.conversation_id) ?? null
  return {
    ...state,
    meta: {
      ...(state?.meta ?? {}),
      "threads.tabs": { value: tabs, source_node: "SYSTEM_UI" },
      "threads.active_id": { value: activeId, source_node: "SYSTEM_UI" },
    },
  }
}
