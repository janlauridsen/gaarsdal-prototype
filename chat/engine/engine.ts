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
} from "@heroicons/react/24/outline"

import { runKernel } from "../chat/engine/engine"
import { createInitialState } from "../chat/kernel/state"
import type {
  ConversationState,
  InputSignal,
  LogEvent,
} from "../chat/kernel/types"

/* =========================
   UI-ONLY LABELS (DATA)
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

  const [state, setState] = useState<ConversationState>(() =>
    createInitialState("ui-session")
  )
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [input, setInput] = useState("")

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state, logs])

  function dispatch(input: InputSignal) {
    const result = runKernel(state, input)
    setState(result.state)
    setLogs((l) => [...l, result.log])
  }

  function sendFreeText() {
    if (!input.trim()) return
    dispatch({ type: "FREE_TEXT", text: input })
    setInput("")
  }

  function go(target: string) {
    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  /* ========================= */

  if (!open) {
    return (
      <button
        className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
        onClick={() => setOpen(true)}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
      </button>
    )
  }

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
          <div className="flex gap-2">
            <button
              title="Vis logs"
              onClick={() => setShowLogs((v) => !v)}
            >
              <BugAntIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ================= BODY ================= */}

        <div className="messages text-sm p-3 overflow-auto flex-1">
          <div className="mb-2 font-medium">
            {NODE_LABELS[state.active_node] ?? state.active_node}
          </div>

          {state.status !== "active" && (
            <div className="text-xs opacity-60 mb-2">
              Status: {state.status}
            </div>
          )}

          {/* Chips */}
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

        <footer className="p-3 border-t">
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

          {/* Logs (toggle) */}
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
