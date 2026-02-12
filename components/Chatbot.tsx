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

/* =========================
   TYPES (UI-LOCAL ONLY)
   ========================= */

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

/* =========================
   UI-ONLY LABELS
   ========================= */

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

const QUICK_ACTIONS = new Set(["HOME", "MAIL", "TLF", "AKUT"])
const TRIAGE_OUTCOMES = new Set([
  "TRIAGE_FIT_BOOKING",
  "TRIAGE_NOT_RELEVANT",
  "TRIAGE_NEEDS_ASSESSMENT",
])

/* ========================= */

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

  /* =========================
     API DISPATCH
     ========================= */

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

  async function dispatch(input: InputSignal) {
    if (!state) return

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, input }),
    })

    const data: KernelResponse = await res.json()

    const userLabel =
      input.type === "EXPLICIT_TRANSITION"
        ? `Valgte: ${NODE_LABELS[input.target] ?? input.target}`
        : input.type === "FREE_TEXT"
          ? input.text
          : ""

    if (userLabel) appendUserMessage(userLabel)

    setState(data.state)
    setLogs((l) => [...l, data.log])
    appendAssistantMessage(
      data.transition?.response_message ?? data.state.active_node_message
    )
  }

  async function init() {
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: null,
          input: { type: "SYSTEM_INIT" },
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

  function resetConversation() {
    setLogs([])
    setInput("")
    setMessages([])
    setState(null)
    init()
  }

  function clearHistory() {
    setMessages([])
  }

  /* ========================= */

  function sendFreeText() {
    if (!input.trim() || !state) return
    if (state.status !== "active" && state.active_node !== "TRIAGE") return
    dispatch({ type: "FREE_TEXT", text: input })
    setInput("")
  }

  function go(target: string) {
    if (!state) return
    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  function handleChip(chip: { id: string; label: string }) {
    const chipTransitions: Record<string, string> = {
      book: "BOOKING",
      stop: "HOME",
    }

    const explicitTarget = chipTransitions[chip.id]
    if (explicitTarget) {
      go(explicitTarget)
      return
    }

    if (state?.active_node === "TRIAGE") {
      dispatch({ type: "FREE_TEXT", text: chip.label })
    } else {
      setInput(chip.label)
    }
  }

  /* =========================
     LAUNCHER
     ========================= */

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

  /* =========================
     DERIVED UI DATA
     ========================= */

  const triageChipsRaw = state?.meta?.["triage.chips"]?.value
  const lastLog = logs[logs.length - 1]
  const showTriageChips =
    !!state &&
    state.status === "active" &&
    state.active_node === "TRIAGE" &&
    (lastLog?.input_type === "FREE_TEXT" || lastLog?.input_type === "FREE_TEXT_RESOLVED")

  const triageChips = showTriageChips
    ? Array.isArray(triageChipsRaw)
      ? triageChipsRaw.filter(
          (chip: any) =>
            chip && typeof chip.id === "string" && typeof chip.label === "string"
        )
      : []
    : []

  const primaryTransitions = state
    ? state.allowed_transitions.filter((t) => {
        if (QUICK_ACTIONS.has(t)) return false
        if (state.active_node === "TRIAGE" && t === "TRIAGE") return false
        if (state.active_node === "TRIAGE" && TRIAGE_OUTCOMES.has(t)) return false
        return true
      })
    : []

  /* =========================
     MODAL
     ========================= */

  return (
    <>
      <div
        className="gaarsdal-overlay"
        onClick={() => setOpen(false)}
      />

      <div
        className="fixed bottom-6 right-6 w-[380px] h-[560px] gaarsdal-chatbot"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Chatbot"
      >
        {/* HEADER */}
        <div className="gaarsdal-chatbot-header flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Gaarsdal Chat</div>
            <div className="text-xs gaarsdal-meta truncate">
              {state
                ? `${NODE_LABELS[state.active_node] ?? state.active_node} · rev ${state.revision}`
                : "Initialiserer..."}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="gaarsdal-icon-btn"
              aria-label="Forside"
              onClick={() => state && go("HOME")}
              title="Forside"
            >
              <HomeIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Telefon"
              onClick={() => state && go("TLF")}
              title="Telefon"
            >
              <PhoneIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="E-mail"
              onClick={() => state && go("MAIL")}
              title="E-mail"
            >
              <EnvelopeIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Akut"
              onClick={() => state && go("AKUT")}
              title="Akut"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Vis logs"
              onClick={() => setShowLogs((v) => !v)}
              title="Logs"
            >
              <BugAntIcon className="w-5 h-5" />
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Luk"
              onClick={() => setOpen(false)}
              title="Luk"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="messages">
          {loading && (
            <div className="text-sm gaarsdal-meta">Initialiserer…</div>
          )}

          {!loading && messages.length === 0 && (
            <div className="text-sm gaarsdal-meta">
              Ingen beskeder endnu.
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`message ${m.role === "assistant" ? "bot" : "user"}`}
            >
              {m.text}
            </div>
          ))}

          {/* TRIAGE CHIPS */}
          {triageChips.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Forslag</div>
              <div className="gaarsdal-chip-group">
                {triageChips.map((chip: any) => (
                  <button
                    key={chip.id}
                    className="chip"
                    onClick={() => handleChip(chip)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TRANSITIONS */}
          {state && primaryTransitions.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Muligheder</div>
              <div className="gaarsdal-chip-group">
                {primaryTransitions.map((t) => (
                  <button
                    key={t}
                    className="chip"
                    onClick={() => go(t)}
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

        {/* FOOTER */}
        <div className="gaarsdal-chatbot-footer">
          <div className="flex items-start gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv her…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendFreeText()
                }
              }}
              disabled={!state || loading}
            />

            <div className="flex flex-col gap-2 pt-1">
              <button
                className="gaarsdal-icon-btn"
                aria-label="Ryd chat"
                onClick={clearHistory}
                title="Ryd chat"
              >
                <TrashIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="Reset"
                onClick={resetConversation}
                title="Reset"
              >
                <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <button
              className="chip"
              onClick={sendFreeText}
              disabled={!input.trim() || !state || loading}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
