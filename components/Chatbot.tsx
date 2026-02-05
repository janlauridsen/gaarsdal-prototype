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
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"

/* =========================
   TYPES (UI-LOCAL ONLY)
   ========================= */

type ConversationState = {
  conversation_id: string
  revision: number
  active_node: string
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

/* =========================
   UI-ONLY LABELS
   ========================= */

const NODE_LABELS: Record<string, string> = {
  HOME: "Forside",
  GEN_HYPNO: "Generelt om hypnoterapi",
  TRIAGE: "Triage",
  BOOKING: "Book tid",
  MAIL: "E-mail",
  TLF: "Telefon",
  AKUT: "Akut",
}

/* ========================= */

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  const [state, setState] = useState<ConversationState | null>(
    null
  )
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [input, setInput] = useState("")

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state, logs])

  /* =========================
     API DISPATCH
     ========================= */

  async function dispatch(input: InputSignal) {
    if (!state) return

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, input }),
    })

    const data: KernelResponse = await res.json()
    setState(data.state)
    setLogs((l) => [...l, data.log])
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
  }

  function resetConversation() {
    setLogs([])
    setInput("")
    setState(null)
    init()
  }

  function clearLogs() {
    setLogs([])
  }

  /* ========================= */

  function sendFreeText() {
    if (!input.trim() || !state) return
    dispatch({ type: "FREE_TEXT", text: input })
    setInput("")
  }

  function go(target: string) {
    if (!state) return
    dispatch({ type: "EXPLICIT_TRANSITION", target })
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
              className="gaarsdal-icon-btn gaarsdal-icon-disabled"
              title="Tilbage"
              aria-disabled="true"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
            </button>
            <button
              className="gaarsdal-icon-btn gaarsdal-icon-disabled"
              title="Frem"
              aria-disabled="true"
            >
              <ArrowUturnRightIcon className="w-4 h-4" />
            </button>
            <button
              className="gaarsdal-icon-btn"
              title="Ryd logs"
              onClick={clearLogs}
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
          <div className="mb-2 font-medium">
            {NODE_LABELS[state.active_node] ??
              state.active_node}
          </div>

          {state.status !== "active" && (
            <div className="text-xs opacity-60 mb-2">
              Status: {state.status}
            </div>
          )}

          {state.status === "active" && (
            <div className="flex flex-wrap gap-2 mt-2">
              {state.allowed_transitions.map((t) => (
                <button
                  key={t}
                  className="chip"
                  onClick={() => go(t)}
                >
                  {NODE_LABELS[t] ?? t}
                </button>
              ))}
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

          <div className="flex justify-center gap-4 mt-3">
            <button onClick={() => go("HOME")}>
              <HomeIcon className="w-5 h-5" />
            </button>
            <button onClick={() => go("MAIL")}>
              <EnvelopeIcon className="w-5 h-5" />
            </button>
            <button onClick={() => go("TLF")}>
              <PhoneIcon className="w-5 h-5" />
            </button>
            <button onClick={() => go("AKUT")}>
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
