"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  BugAntIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

type ConversationState = {
  conversation_id: string
  revision: number
  active_node: string
  active_node_message: string
  allowed_transitions: string[]
  meta: Record<string, any>
  status: "active" | "paused" | "completed" | "rejected"
  parentese_stack: string[]
}

type InputSignal =
  | { type: "EXPLICIT_TRANSITION"; target: string }
  | { type: "FREE_TEXT"; text: string }

type LogEvent = any

type KernelResponse = {
  state: ConversationState
  transition: any
  log: LogEvent
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const NODE_LABELS: Record<string, string> = {
  HOME: "Forside",
  GEN_HYPNO: "Generelt om hypnoterapi",
  TRIAGE: "Triage",
  TRIAGE_FIT_BOOKING: "Triage: egnet til booking",
  TRIAGE_NOT_RELEVANT: "Triage: ikke relevant",
  TRIAGE_NEEDS_ASSESSMENT: "Triage: afklaringssamtale",
  BOOKING: "Book tid",
  MAIL: "E-mail",
  TLF: "Telefon",
  CONTACT_FORM: "Kontaktformular",
  AKUT: "Akut",
}

const QUICK_ACTIONS = ["HOME", "TLF", "MAIL", "AKUT"] as const

const DEFAULT_CHIPS = [
  { id: "tell_more", label: "Fortæl mere" },
  { id: "why_relevant", label: "Hvorfor relevant?" },
  { id: "next_steps", label: "Hvad er næste skridt?" },
  { id: "stop", label: "Stop her" },
]

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const [state, setState] = useState<ConversationState | null>(null)
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, showLogs])

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function appendAssistantMessage(text: string) {
    const message = text.trim()
    if (!message) return
    appendMessage({
      id: `assistant-${Date.now()}-${Math.random()}`,
      role: "assistant",
      text: message,
    })
  }

  function appendUserMessage(text: string) {
    const message = text.trim()
    if (!message) return
    appendMessage({
      id: `user-${Date.now()}-${Math.random()}`,
      role: "user",
      text: message,
    })
  }

  async function init() {
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: null,
          input: { type: "SYSTEM_INIT" }, // ignoreres når state === null (API init branch)
        }),
      })

      const data: KernelResponse = await res.json()
      setState(data.state)
      setMessages([])
      setLogs([])
      appendAssistantMessage(data.state.active_node_message)
    } finally {
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal) {
    if (!state) return

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, input: nextInput }),
    })

    const data: KernelResponse = await res.json()

    // UI echo af bruger-handling
    if (nextInput.type === "EXPLICIT_TRANSITION") {
      appendUserMessage(`Valgte: ${NODE_LABELS[nextInput.target] ?? nextInput.target}`)
    } else if (nextInput.type === "FREE_TEXT") {
      appendUserMessage(nextInput.text)
    }

    setState(data.state)
    setLogs((l) => [...l, data.log])

    // Vis AI/Kernel output
    const assistantText =
      (data.transition?.response_message as string | undefined) ??
      data.state.active_node_message

    appendAssistantMessage(assistantText)
  }

  function resetConversation() {
    // Reset = ny samtale/kernel state
    setLogs([])
    setInput("")
    setMessages([])
    setState(null)
    init()
  }

  function clearHistory() {
    // Skraldespand = ryd kun UI-visning
    setMessages([])
  }

  function go(target: string) {
    if (!state) return
    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  function sendFreeText() {
    if (!state) return
    const text = input.trim()
    if (!text) return
    dispatch({ type: "FREE_TEXT", text })
    setInput("")
  }

  function handleChip(chip: { id: string; label: string }) {
    // Minimal mapping hvis du vil bruge chips til explicit navigation
    const map: Record<string, string> = {
      stop: "HOME",
    }
    const target = map[chip.id]
    if (target) return go(target)

    // Default: send chip label som fri tekst
    dispatch({ type: "FREE_TEXT", text: chip.label })
  }

  // Launcher
  if (!open) {
    return (
      <button
        aria-label="Åbn chatbot"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-md flex items-center justify-center bg-[#4A5D54]"
        onClick={() => {
          setOpen(true)
          if (!state) init()
        }}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7 text-white" />
      </button>
    )
  }

  const nodeLabel = state
    ? `${NODE_LABELS[state.active_node] ?? state.active_node} · rev ${state.revision}`
    : "Initialiserer..."

  // Chips: triage chips fra meta, kun i TRIAGE
  const triageChipsRaw = state?.meta?.["triage.chips"]?.value
  const triageChips =
    state?.active_node === "TRIAGE"
      ? Array.isArray(triageChipsRaw)
        ? triageChipsRaw
            .filter(
              (c: any) => c && typeof c.id === "string" && typeof c.label === "string"
            )
            .slice(0, 8)
        : DEFAULT_CHIPS
      : []

  // Muligheder: allowed transitions (uden quick actions)
  const optionChips =
    state?.allowed_transitions?.filter(
      (t) => !QUICK_ACTIONS.includes(t as any)
    ) ?? []

  return (
    <>
      <div className="gaarsdal-overlay" onClick={() => setOpen(false)} />

      <div
        className="fixed bottom-6 right-6 w-[380px] h-[560px] gaarsdal-chatbot"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Chatbot"
      >
        {/* HEADER: reset + logs + close */}
        <div className="gaarsdal-chatbot-header flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Gaarsdal Chat</div>
            <div className="text-xs gaarsdal-meta truncate">{nodeLabel}</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="gaarsdal-icon-btn"
              aria-label="Ny samtale (reset kernel state)"
              title="Ny samtale"
              onClick={resetConversation}
              disabled={loading}
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Vis logs"
              title="Logs"
              onClick={() => setShowLogs((v) => !v)}
              disabled={loading}
            >
              <BugAntIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Luk"
              title="Luk"
              onClick={() => setOpen(false)}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="messages">
          {loading && <div className="text-sm gaarsdal-meta">Initialiserer…</div>}

          {!loading && messages.length === 0 && (
            <div className="text-sm gaarsdal-meta">Ingen beskeder endnu.</div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${m.role === "assistant" ? "bot" : "user"}`}
            >
              {m.text}
            </div>
          ))}

          {/* TRIAGE: forslag chips */}
          {state?.active_node === "TRIAGE" && triageChips.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Forslag</div>
              <div className="gaarsdal-chip-group">
                {triageChips.map((chip: any) => (
                  <button
                    key={chip.id}
                    className="chip"
                    onClick={() => handleChip(chip)}
                    disabled={loading || !state}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* OPTIONS: allowed transitions */}
          {optionChips.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Muligheder</div>
              <div className="gaarsdal-chip-group">
                {optionChips.map((t) => (
                  <button
                    key={t}
                    className="chip"
                    onClick={() => go(t)}
                    disabled={loading || !state}
                  >
                    {NODE_LABELS[t] ?? t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOGS */}
          {showLogs && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Logs</div>
              <pre className="text-xs whitespace-pre-wrap bg-white/60 p-2 rounded-lg border border-black/5 max-h-[170px] overflow-auto">
                {JSON.stringify(logs.slice(-10), null, 2)}
              </pre>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* FOOTER: quick actions + input + trash */}
        <div className="gaarsdal-chatbot-footer">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1">
              <button
                className="gaarsdal-icon-btn"
                aria-label="Forside"
                title="Forside"
                onClick={() => go("HOME")}
                disabled={!state || loading}
              >
                <HomeIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="Telefon"
                title="Telefon"
                onClick={() => go("TLF")}
                disabled={!state || loading}
              >
                <PhoneIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="E-mail"
                title="E-mail"
                onClick={() => go("MAIL")}
                disabled={!state || loading}
              >
                <EnvelopeIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="Akut"
                title="Akut"
                onClick={() => go("AKUT")}
                disabled={!state || loading}
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Ryd visning (bevarer kernel state)"
              title="Ryd visning"
              onClick={clearHistory}
              disabled={messages.length === 0}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-start gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv her… (Enter = send, Shift+Enter = ny linje)"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendFreeText()
                }
              }}
              disabled={!state || loading}
            />
          </div>
        </div>
      </div>
    </>
  )
}
