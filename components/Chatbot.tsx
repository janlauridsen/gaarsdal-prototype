"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline"

type BotMessage = { role: "assistant"; content: string }
type UserMessage = { role: "user"; content: string }
type ChatMessage = BotMessage | UserMessage

type State = {
  active_node?: string
  allowed_transitions?: string[]
  meta?: Record<string, any>
  thread_id?: string
}

type ThreadChoice = {
  id: string
  label: string
  kind: string
}

type UiSuggestion = {
  id: string
  label: string
  input?: string
}

type TopicButton = {
  id: string
  label: string
}

const TOPIC_NODES: string[] = ["HOME", "ABOUT", "AI_FAILSAFE", "CONTACT", "PRIVACY"]

function threadCountFromState(state: State): number {
  const count = state?.meta?.["threads.count"]
  return typeof count === "number" ? count : 0
}

function asStringOrNull(x: unknown): string | null {
  return typeof x === "string" ? x : null
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim()
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```[\w-]*\n?/, "").replace(/```$/, "").trim()
  }
  return s
}

function safeJsonParse<T = any>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function normalizeConversation(messages: any): ChatMessage[] {
  if (!Array.isArray(messages)) return []
  const out: ChatMessage[] = []
  for (const m of messages) {
    if (!m || typeof m !== "object") continue
    const role = (m as any).role
    const content = (m as any).content
    if ((role === "assistant" || role === "user") && typeof content === "string") {
      out.push({ role, content } as ChatMessage)
    }
  }
  return out
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

async function postJson<T = any>(url: string, payload: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} ${res.statusText}${t ? `: ${t}` : ""}`)
  }
  return (await res.json()) as T
}

const LOCAL_STORAGE_KEY = "gaarsdal.chatbot.ui"
const DEFAULT_OPEN = false
const DEFAULT_DOCKED = true

export default function Chatbot() {
  const [open, setOpen] = useState<boolean>(DEFAULT_OPEN)
  const [docked, setDocked] = useState<boolean>(DEFAULT_DOCKED)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>("")
  const [busy, setBusy] = useState<boolean>(false)
  const [state, setState] = useState<State | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Persist UI state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (!raw) return
      const obj = safeJsonParse<any>(raw)
      if (!obj || typeof obj !== "object") return
      if (typeof obj.open === "boolean") setOpen(obj.open)
      if (typeof obj.docked === "boolean") setDocked(obj.docked)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ open, docked }))
    } catch {
      // ignore
    }
  }, [open, docked])

  // Load initial state / history
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await postJson<any>("/api/chat", { op: "init" })
        if (cancelled) return
        const st = res?.state as State | undefined
        setState(st ?? null)
        setMessages(normalizeConversation(res?.messages))
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message ?? "Init failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, open])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function metaValue(key: string) {
    return state?.meta?.[key]
  }

  const threadChoicesRaw = metaValue("threads.choices")
  const threadCount = state ? threadCountFromState(state) : 0

  const threadChoices: ThreadChoice[] =
    state?.active_node === "THREAD_CHOOSER" && Array.isArray(threadChoicesRaw)
      ? (threadChoicesRaw as any[])
          .filter((c) => c && typeof c.id === "string" && typeof c.label === "string" && typeof c.kind === "string")
          .slice(0, 12)
      : []

  const uiSuggestionsRaw = metaValue("ui.suggestions")
  const uiSuggestions: UiSuggestion[] = Array.isArray(uiSuggestionsRaw)
    ? (uiSuggestionsRaw as any[])
        .filter((x) => x && typeof x === "object" && typeof (x as any).label === "string")
        .map((x, i) => ({
          id: String((x as any).id ?? i),
          label: String((x as any).label),
          input: (x as any).input,
        }))
    : []

  const showTopics = state?.active_node === "HOME"
  const allowedSet = new Set(state?.allowed_transitions ?? [])
  const topicButtons = showTopics
    ? TOPIC_NODES.map((id) => ({
        id,
        label: id,
      }))
    : []

  const canClose = true
  const canToggleDock = true

  const headerTitle = useMemo(() => {
    const t = asStringOrNull(metaValue("ui.title"))
    return t ?? "Chatbot"
  }, [state])

  const subtitle = useMemo(() => {
    const t = asStringOrNull(metaValue("ui.subtitle"))
    return t ?? ""
  }, [state])

  const infoText = useMemo(() => {
    const t = asStringOrNull(metaValue("ui.info"))
    return t ?? ""
  }, [state])

  function pushUserMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: "user", content: trimmed }])
  }

  function pushAssistantMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setMessages((prev) => [...prev, { role: "assistant", content: trimmed }])
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setError(null)
    pushUserMessage(trimmed)
    setInput("")
    setBusy(true)

    try {
      const res = await postJson<any>("/api/chat", {
        op: "message",
        input: trimmed,
        state,
      })

      const newState = (res?.state as State | undefined) ?? null
      const assistantText = typeof res?.message === "string" ? res.message : ""
      const mergedMessages = normalizeConversation(res?.messages)

      setState(newState)
      if (mergedMessages.length) {
        setMessages(mergedMessages)
      } else if (assistantText) {
        pushAssistantMessage(assistantText)
      }
    } catch (e: any) {
      setError(e?.message ?? "Send failed")
    } finally {
      setBusy(false)
    }
  }

  async function transition(id: string) {
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      const res = await postJson<any>("/api/chat", {
        op: "transition",
        id,
        state,
      })
      const newState = (res?.state as State | undefined) ?? null
      const assistantText = typeof res?.message === "string" ? res.message : ""
      const mergedMessages = normalizeConversation(res?.messages)

      setState(newState)
      if (mergedMessages.length) {
        setMessages(mergedMessages)
      } else if (assistantText) {
        pushAssistantMessage(assistantText)
      }
    } catch (e: any) {
      setError(e?.message ?? "Transition failed")
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void send(input)
  }

  function toggleDock() {
    setDocked((v) => !v)
  }

  function close() {
    if (!canClose) return
    setOpen(false)
  }

  function openChat() {
    setOpen(true)
  }

  const containerClass =
    "fixed z-50 " +
    (docked
      ? "bottom-4 right-4 w-[min(420px,calc(100vw-2rem))] h-[min(640px,calc(100vh-2rem))]"
      : "inset-4 w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]") +
    " bg-white shadow-2xl rounded-xl border border-gray-200 flex flex-col overflow-hidden"

  const headerClass = "flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50"
  const bodyClass = "flex-1 overflow-y-auto px-3 py-3 space-y-3"
  const footerClass = "border-t border-gray-200 px-3 py-2 bg-white"

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={openChat}
          className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-2"
          aria-label="Open chat"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
          <span className="text-sm font-medium">{headerTitle}</span>
        </button>
      ) : (
        <div className={containerClass} role="dialog" aria-modal="true" aria-label={headerTitle}>
          <div className={headerClass}>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{headerTitle}</div>
              {subtitle ? <div className="text-xs text-gray-500 truncate">{subtitle}</div> : null}
            </div>

            <div className="flex items-center gap-1">
              {infoText ? (
                <button
                  type="button"
                  className="p-2 rounded hover:bg-gray-100"
                  title="Info"
                  onClick={() => pushAssistantMessage(infoText)}
                >
                  <InformationCircleIcon className="w-5 h-5" />
                </button>
              ) : null}

              {canToggleDock ? (
                <button type="button" className="p-2 rounded hover:bg-gray-100" title="Toggle size" onClick={toggleDock}>
                  {docked ? <ArrowsPointingOutIcon className="w-5 h-5" /> : <ArrowsPointingInIcon className="w-5 h-5" />}
                </button>
              ) : null}

              {canClose ? (
                <button type="button" className="p-2 rounded hover:bg-gray-100" title="Close" onClick={close}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          </div>

          <div ref={scrollRef} className={bodyClass}>
            {error ? (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>
            ) : null}

            {threadChoices.length ? (
              <div className="flex flex-wrap gap-2">
                {threadChoices.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="text-xs rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                    disabled={busy}
                    onClick={() => transition(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            ) : null}

            {topicButtons.length ? (
              <div className="flex flex-wrap gap-2">
                {topicButtons.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="text-xs rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                    disabled={busy || !allowedSet.has(t.id)}
                    onClick={() => transition(t.id)}
                    title={!allowedSet.has(t.id) ? "Not available right now" : ""}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : null}

            {uiSuggestions.length ? (
              <div className="flex flex-wrap gap-2">
                {uiSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="text-xs rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50"
                    disabled={busy}
                    onClick={() => void send(s.input ?? s.label)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap " +
                  (m.role === "user" ? "ml-auto bg-gray-900 text-white" : "mr-auto bg-gray-100 text-gray-900")
                }
              >
                {stripCodeFence(m.content)}
              </div>
            ))}

            {busy ? <div className="text-xs text-gray-500">Working…</div> : null}

            {threadCount > 0 ? (
              <div className="text-[11px] text-gray-400 pt-2">Thread: {state?.thread_id ?? "—"} · Count: {threadCount}</div>
            ) : null}
          </div>

          <div className={footerClass}>
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="px-3 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
