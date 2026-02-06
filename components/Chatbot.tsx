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
  PlusIcon,
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

  const [state, setState] = useState<ConversationState | null>(
    null
  )
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

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

    if (userLabel) {
      appendUserMessage(userLabel)
    }

    setState(data.state)
    setLogs((l) => [...l, data.log])
    appendAssistantMessage(
      data.transition?.response_message ??
        data.state.active_node_message
    )
  }

  async function init() {
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
    appendAssistantMessage(data.state.active_node_message)
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
    if (state.status !== "active" && state.active_node !== "TRIAGE") {
      return
    }
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

  /* ========================= */

  if (!open) {
    return (
      <button
        className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
        onClick={() => {
          setOpen(true)
          if (!state) init()
        }}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
      </button>
    )
  }

  if (!state) return null

  const triageChipsRaw = state.meta?.["triage.chips"]?.value
  const triageChips =
    state.status === "active" && state.active_node === "TRIAGE"
      ? Array.isArray(triageChipsRaw)
        ? triageChipsRaw.filter(
            (chip) =>
              chip &&
              typeof chip.id === "string" &&
              typeof chip.label === "string"
          )
        : []
      : []
  const primaryTransitions = state.allowed_transitions.filter((t) => {
    if (QUICK_ACTIONS.has(t)) return false
    if (state.active_node === "TRIAGE" && TRIAGE_OUTCOMES.has(t)) return false
    return true
  })

  return (
    <>
      <div
        className="gaarsdal-overlay"
        onClick={() => setOpen(false)}
      />

      <div
        className="gaarsdal-chatbot fixed bottom-24 right-6 w-96 max-w-[90vw] h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}

        <header className="gaarsdal-chatbot-header flex justify-between items-center">
          <span className="font-medium text-sm">Gaarsdal</span>
          <div className="flex gap-1">
            <button
              className="gaarsdal-icon-btn"
              title="Ny samtale"
              onClick={resetConversation}
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              title="Ryd historik"
              onClick={clearHistory}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              title="Vis logs"
              onClick={() => setShowLogs((v) => !v)}
            >
              <BugAntIcon className="w-5 h-5" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              onClick={() => setOpen(false)}
              title="Luk"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================= BODY ================= */}

        <div className="messages text-sm p-3 overflow-auto flex-1">
          <div className="flex items-center justify-between mb-2 text-xs uppercase tracking-wide gaarsdal-meta">
            <span>
              {NODE_LABELS[state.active_node] ??
                state.active_node}
            </span>
            {state.status !== "active" && (
              <span>Status: {state.status}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${
                  message.role === "assistant"
                    ? "bot"
                    : "user"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          {triageChips.length > 0 && (
            <div className="mb-4">
              <div className="gaarsdal-section-title">
                Forslag til svar (klik)
              </div>
              <div className="gaarsdal-chip-group">
                {triageChips.map((chip) => (
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

          {state.status === "active" &&
            primaryTransitions.length > 0 && (
              <div className="mb-4">
                <div className="gaarsdal-section-title">
                  Menuvalg
                </div>
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

          <div ref={endRef} />
        </div>

        {/* ================= FOOTER ================= */}

        <footer className="gaarsdal-chatbot-footer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendFreeText()
              }
            }}
            placeholder="Skriv frit…"
          />
          <button
            className="chip mt-3"
            onClick={sendFreeText}
            disabled={!input.trim()}
          >
            Send
          </button>

          <div className="flex justify-center gap-4 mt-3">
            <button
              className="gaarsdal-icon-btn"
              onClick={() => go("HOME")}
              aria-label="Til forsiden"
              title="Forside"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              onClick={() => go("MAIL")}
              aria-label="Skriv email"
              title="E-mail"
            >
              <EnvelopeIcon className="w-5 h-5" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              onClick={() => go("TLF")}
              aria-label="Ring"
              title="Telefon"
            >
              <PhoneIcon className="w-5 h-5" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              onClick={() => go("AKUT")}
              aria-label="Akut hjælp"
              title="Akut"
            >
              <ExclamationTriangleIcon className="w-5 h-5" />
            </button>
          </div>

          {showLogs && (
            <div className="mt-3 text-xs opacity-60">
              <pre className="overflow-auto max-h-40">
                {JSON.stringify(logs, null, 2)}
              </pre>
            </div>
          )}
        </footer>
      </div>
    </>
  )
}
