"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InformationCircleIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
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

type KernelResponse = {
  state: ConversationState
  transition: any
  log: any
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const NODE_LABELS: Record<string, string> = {
  HOME: "Forside",
  GEN_HYPNO: "Spørg om hypnoterapi",
  TRIAGE: "Passer hypnoterapi til min situation?",
  METHOD_FIT: "Hypnoterapi eller et bedre alternativ?",
  BOOKING: "Book tid",
  MAIL: "E-mail",
  TLF: "Telefon",
  CONTACT_FORM: "Kontaktformular",
  AKUT: "Akut",
}

const TOPIC_TOOLTIPS: Record<string, string> = {
  GEN_HYPNO: "Fri samtale med viden og erfaring (ingen behandling i chatten).",
  TRIAGE: "Kort afklaring: få spørgsmål og relevansvurdering for din situation.",
  METHOD_FIT:
    "Sammenlign retninger: hypnoterapi vs typiske alternativer (overblik, ikke behandling).",
  BOOKING: "Vælg kontaktvej for booking.",
}

const DEFAULT_TRIAGE_CHIPS = [
  { id: "tell_more", label: "Fortæl mere" },
  { id: "why_relevant", label: "Hvorfor relevant?" },
  { id: "next_steps", label: "Hvad er næste skridt?" },
  { id: "stop", label: "Stop her" },
]

const TOPIC_NODES: string[] = ["GEN_HYPNO", "TRIAGE", "METHOD_FIT", "BOOKING"]

function getTopicIcon(nodeId: string) {
  switch (nodeId) {
    case "GEN_HYPNO":
      return <InformationCircleIcon className="w-5 h-5" />
    case "TRIAGE":
      return <ClipboardDocumentCheckIcon className="w-5 h-5" />
    case "METHOD_FIT":
      return <Squares2X2Icon className="w-5 h-5" />
    case "BOOKING":
      return <CalendarDaysIcon className="w-5 h-5" />
    default:
      return <InformationCircleIcon className="w-5 h-5" />
  }
}

function readMetaNumber(state: ConversationState | null, key: string): number {
  const raw = state?.meta?.[key]?.value
  return typeof raw === "number" ? raw : 0
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [state, setState] = useState<ConversationState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [navBanner, setNavBanner] = useState<string | null>(null)
  const navBannerTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, navBanner, expanded])

  useEffect(() => {
    return () => {
      if (navBannerTimerRef.current) {
        window.clearTimeout(navBannerTimerRef.current)
        navBannerTimerRef.current = null
      }
    }
  }, [])

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function appendAssistantMessage(text: string) {
    const message = text.trim()
    if (!message) return

    const last = messages.length ? messages[messages.length - 1] : null
    if (last && last.role === "assistant" && last.text.trim() === message) return

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

  function showNavBanner(label: string) {
    if (navBannerTimerRef.current) {
      window.clearTimeout(navBannerTimerRef.current)
      navBannerTimerRef.current = null
    }
    setNavBanner(label)
    navBannerTimerRef.current = window.setTimeout(() => {
      setNavBanner(null)
      navBannerTimerRef.current = null
    }, 3300)
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
      setInput("")
      setNavBanner(null)
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

    if (nextInput.type === "EXPLICIT_TRANSITION") {
      showNavBanner(`Valgte: ${NODE_LABELS[nextInput.target] ?? nextInput.target}`)
    } else if (nextInput.type === "FREE_TEXT") {
      appendUserMessage(nextInput.text)
    }

    setState(data.state)

    const assistantText =
      (data.transition?.response_message as string | undefined) ?? data.state.active_node_message

    appendAssistantMessage(assistantText)
  }

  function resetConversation() {
    setInput("")
    setMessages([])
    setState(null)
    setNavBanner(null)
    setExpanded(false)
    init()
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

  function handleTriageChip(chip: { id: string; label: string }) {
    const map: Record<string, string> = { stop: "HOME" }
    const target = map[chip.id]
    if (target) return go(target)
    dispatch({ type: "FREE_TEXT", text: chip.label })
  }

  function openContactForm() {
    window.location.href = "/kontakt"
  }

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

  // TRIAGE: show suggestions after at least one triage exchange (meta-based, not UI logs)
  const triageQuestionCount = readMetaNumber(state, "triage.question_count")
  const triageSuggestionsAllowed = state?.active_node === "TRIAGE" && triageQuestionCount >= 1

  const triageChipsRaw = state?.meta?.["triage.chips"]?.value
  const triageChips =
    triageSuggestionsAllowed
      ? Array.isArray(triageChipsRaw)
        ? triageChipsRaw
            .filter((c: any) => c && typeof c.id === "string" && typeof c.label === "string")
            .slice(0, 8)
        : DEFAULT_TRIAGE_CHIPS
      : []

  // Topics only on HOME (UI-owned), but disabled unless kernel allows them
  const showTopics = state?.active_node === "HOME"
  const allowedSet = new Set(state?.allowed_transitions ?? [])
  const topicButtons = showTopics
    ? TOPIC_NODES.map((id) => ({
        id,
        label: NODE_LABELS[id] ?? id,
        enabled: state ? allowedSet.has(id) || id === state.active_node : false,
        tooltip: TOPIC_TOOLTIPS[id] ?? "",
      })).filter((t) => t.id !== state?.active_node)
    : []

  const containerClass = expanded
    ? "gaarsdal-chatbot gaarsdal-chatbot--expanded"
    : "gaarsdal-chatbot gaarsdal-chatbot--normal"

  return (
    <>
      <div className="gaarsdal-overlay" onClick={() => setOpen(false)} />

      <div
        className={containerClass}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Chatbot"
      >
        <div className="gaarsdal-chatbot-header flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Gaarsdal Chat</div>
            <div className="text-xs gaarsdal-meta truncate">
              {state ? NODE_LABELS[state.active_node] ?? state.active_node : "Initialiserer..."}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              className="gaarsdal-icon-btn"
              aria-label={expanded ? "Formindsk" : "Forstør"}
              title={expanded ? "Formindsk" : "Forstør"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>

            <button
              className="gaarsdal-icon-btn"
              aria-label="Ny samtale"
              title="Ny samtale"
              onClick={resetConversation}
              disabled={loading}
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
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

        {navBanner && (
          <div className="px-3 pt-3">
            <div className="w-full rounded-lg px-3 py-2 text-sm bg-black/10 border border-black/5">
              {navBanner}
            </div>
          </div>
        )}

        <div className="messages">
          {loading && <div className="text-sm gaarsdal-meta">Initialiserer…</div>}

          {messages.map((m) => (
            <div key={m.id} className={`message ${m.role === "assistant" ? "bot" : "user"}`}>
              {m.text}
            </div>
          ))}

          {state?.active_node === "TRIAGE" && triageChips.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Forslag</div>
              <div className="gaarsdal-chip-group">
                {triageChips.map((chip: any) => (
                  <button
                    key={chip.id}
                    className="chip"
                    onClick={() => handleTriageChip(chip)}
                    disabled={loading || !state}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {topicButtons.length > 0 && (
            <div className="mt-3">
              <div className="gaarsdal-section-title">Emner</div>

              <div className="gaarsdal-topic-grid">
                {topicButtons.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => go(t.id)}
                    disabled={!t.enabled || loading || !state}
                    title={t.tooltip || (!t.enabled ? "Ikke tilgængelig herfra" : "")}
                    className="gaarsdal-topic-card"
                  >
                    <span className="gaarsdal-topic-icon">{getTopicIcon(t.id)}</span>
                    <span className="gaarsdal-topic-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className="gaarsdal-chatbot-footer">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1">
              <button
                className="gaarsdal-icon-btn"
                aria-label="Forside"
                title="Forside"
                onClick={() => state && go("HOME")}
                disabled={!state || loading}
              >
                <HomeIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="Telefon"
                title="Telefon"
                onClick={() => state && go("TLF")}
                disabled={!state || loading}
              >
                <PhoneIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="E-mail"
                title="E-mail"
                onClick={() => state && go("MAIL")}
                disabled={!state || loading}
              >
                <EnvelopeIcon className="w-5 h-5" />
              </button>

              <button
                className="gaarsdal-icon-btn"
                aria-label="Kontaktformular"
                title="Kontaktformular"
                onClick={openContactForm}
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center">
              <button
                className="gaarsdal-icon-btn"
                aria-label="Akut"
                title="Akut"
                onClick={() => state && go("AKUT")}
                disabled={!state || loading}
              >
                <ExclamationTriangleIcon className="w-5 h-5" />
              </button>
            </div>
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
