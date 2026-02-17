"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InformationCircleIcon,
  RectangleStackIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"

import styles from "./Chatbot.module.css"

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
  | { type: "SYSTEM_INIT" }

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
  DEV_SANDBOX_INTRO: "Sandbox (dev)",
  MAIL: "E-mail",
  TLF: "Telefon",
  CONTACT_FORM: "Kontaktformular",
  AKUT: "Akut",
  THREAD_CHOOSER: "Tråde",
}

const TOPIC_TOOLTIPS: Record<string, string> = {
  GEN_HYPNO: "Fri samtale med viden og erfaring (ingen behandling i chatten).",
  TRIAGE: "Kort afklaring: få spørgsmål og relevansvurdering for din situation.",
  METHOD_FIT: "Sammenlign retninger: hypnoterapi vs typiske alternativer (overblik, ikke behandling).",
  BOOKING: "Vælg kontaktvej for booking.",
  DEV_SANDBOX_INTRO: "Dev-flow: form → tool → checkpoint → track/profile.",
}

const DEFAULT_TRIAGE_CHIPS = [
  { id: "tell_more", label: "Fortæl mere" },
  { id: "why_relevant", label: "Hvorfor relevant?" },
  { id: "next_steps", label: "Hvad er næste skridt?" },
  { id: "evidence", label: "Hvad virker typisk?" },
]

const TOPIC_NODES = ["GEN_HYPNO", "TRIAGE", "METHOD_FIT", "BOOKING", "DEV_SANDBOX_INTRO"] as const

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [insightsOpen, setInsightsOpen] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [insightsPayload, setInsightsPayload] = useState<any>(null)

  const [state, setState] = useState<ConversationState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)

  function metaValue(key: string, s: ConversationState | null = state) {
    const entry = s?.meta?.[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const activeNodeLabel = state ? NODE_LABELS[state.active_node] ?? state.active_node : "Initialiserer…"

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    return true
  }, [state])

  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (state.active_node === "THREAD_CHOOSER") return "Vælg en tråd…"
    return "Skriv her… (Enter = send, Shift+Enter = ny linje)"
  }, [state])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, expanded, insightsOpen, headerNavHint])

  useEffect(() => {
    return () => {
      if (headerNavHintTimerRef.current) {
        window.clearTimeout(headerNavHintTimerRef.current)
        headerNavHintTimerRef.current = null
      }
    }
  }, [])

  function appendMessage(message: ChatMessage) {
    setMessages((prev) => [...prev, message])
  }

  function appendAssistantMessage(text: string) {
    const message = text.trim()
    if (!message) return

    setMessages((prev) => {
      const last = prev.length ? prev[prev.length - 1] : null
      if (last && last.role === "assistant" && last.text.trim() === message) return prev
      return [
        ...prev,
        {
          id: `assistant-${Date.now()}-${Math.random()}`,
          role: "assistant",
          text: message,
        },
      ]
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

  function showHeaderNavHint(text: string) {
    if (headerNavHintTimerRef.current) {
      window.clearTimeout(headerNavHintTimerRef.current)
      headerNavHintTimerRef.current = null
    }
    setHeaderNavHint(text)
    headerNavHintTimerRef.current = window.setTimeout(() => {
      setHeaderNavHint(null)
      headerNavHintTimerRef.current = null
    }, 2600)
  }

  async function postChat(nextState: ConversationState | null, nextInput: any): Promise<KernelResponse> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: nextState, input: nextInput }),
    })
    return res.json()
  }

  async function init() {
    setLoading(true)
    try {
      // 1) SYSTEM_INIT (giver typisk THREAD_CHOOSER)
      const initResp = await postChat(null, { type: "SYSTEM_INIT" })

      // 2) Hvis ingen tråde: auto-start new uden at vise THREAD_CHOOSER UI
      if (initResp.state.active_node === "THREAD_CHOOSER") {
        const count = metaValue("threads.count", initResp.state)
        const n = typeof count === "number" ? count : Number(count ?? 0)

        if (!Number.isFinite(n) || n <= 0) {
          const newResp = await postChat(initResp.state, { type: "FREE_TEXT", text: "new" })
          setState(newResp.state)
          setMessages([])
          setInput("")
          setHeaderNavHint(null)
          appendAssistantMessage(newResp.state.active_node_message)
          return
        }
      }

      setState(initResp.state)
      setMessages([])
      setInput("")
      setHeaderNavHint(null)
      appendAssistantMessage(initResp.state.active_node_message)
    } finally {
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal) {
    if (!state) return

    setLoading(true)
    try {
      const fromNode = state.active_node

      const data = await postChat(state, nextInput)

      if (nextInput.type === "EXPLICIT_TRANSITION") {
        const fromLabel = NODE_LABELS[fromNode] ?? fromNode
        const toNode = data?.state?.active_node ?? nextInput.target
        const toLabel = NODE_LABELS[toNode] ?? toNode
        showHeaderNavHint(`${fromLabel} → ${toLabel}`)
      } else if (nextInput.type === "FREE_TEXT") {
        appendUserMessage(nextInput.text)
      }

      setState(data.state)

      const assistantText =
        (data.transition?.response_message as string | undefined) ?? data.state.active_node_message

      appendAssistantMessage(assistantText)
    } finally {
      setLoading(false)
    }
  }

  function closeInsights() {
    setInsightsOpen(false)
    setInsightsLoading(false)
    setInsightsError(null)
    setInsightsPayload(null)
  }

  async function openInsights() {
    setInsightsOpen(true)
    setInsightsLoading(true)
    setInsightsError(null)
    setInsightsPayload(null)

    try {
      const res = await fetch("/api/insights", { method: "GET" })
      if (!res.ok) throw new Error(`Insights: HTTP ${res.status}`)
      const payload = await res.json()
      setInsightsPayload(payload)
    } catch (e: any) {
      setInsightsError(e?.message ?? "Kunne ikke hente insights")
    } finally {
      setInsightsLoading(false)
    }
  }

  function toggleInsights() {
    if (insightsOpen) closeInsights()
    else openInsights()
  }

  function toggleExpanded() {
    setExpanded((v) => !v)
  }

  // “Skift tråd” = re-init (går til lobby/THREAD_CHOOSER)
  function openThreads() {
    setMessages([])
    setInput("")
    setState(null)
    setHeaderNavHint(null)
    closeInsights()
    init()
  }

  function go(target: string) {
    if (!state) return
    appendUserMessage(NODE_LABELS[target] ?? target)
    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  const triageChipsRaw = metaValue("triage.chips")
  const triageSuggestionsAllowed = state?.active_node === "TRIAGE"
  const triageChips = triageSuggestionsAllowed
    ? Array.isArray(triageChipsRaw)
      ? triageChipsRaw
          .filter((c: any) => c && typeof c.id === "string" && typeof c.label === "string")
          .slice(0, 8)
      : DEFAULT_TRIAGE_CHIPS
    : []

  const threadChoicesRaw = metaValue("threads.choices")
  const threadChoices =
    state?.active_node === "THREAD_CHOOSER" && Array.isArray(threadChoicesRaw)
      ? threadChoicesRaw
          .filter((c: any) => c && typeof c.id === "string" && typeof c.label === "string")
          .filter((c: any) => c.id !== "new") // vi viser ikke “new” som valg; brugeren kan vælge eksisterende
          .slice(0, 10)
      : []

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

  const containerClass = `${styles.chatbot} ${expanded ? styles.expanded : styles.normal}`

  return (
    <>
      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} />

          <div
            className={containerClass}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Chatbot"
          >
            <div className={styles.header}>
              <div className={styles.titleRow}>
                <div className={styles.title}>Gaarsdal Chat</div>
                <div className={styles.nodeLabel}>{activeNodeLabel}</div>
                {headerNavHint && <div className={styles.headerHint}>{headerNavHint}</div>}
              </div>

              <div className={styles.headerActions}>
                <button className={styles.iconBtn} onClick={openThreads} title="Skift tråd">
                  <RectangleStackIcon className="w-5 h-5" />
                </button>

                <button className={styles.iconBtn} onClick={toggleInsights} title="Insights">
                  <InformationCircleIcon className="w-5 h-5" />
                </button>

                <button className={styles.iconBtn} onClick={toggleExpanded} title={expanded ? "Minimer" : "Maksimer"}>
                  {expanded ? (
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                  )}
                </button>

                <button className={styles.iconBtn} onClick={() => setOpen(false)} title="Luk">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className={styles.messages}>
              {messages.map((m) => (
                <div key={m.id} className={m.role === "assistant" ? styles.messageBot : styles.messageUser}>
                  {m.text}
                </div>
              ))}

              {/* THREAD_CHOOSER: vis kun eksisterende tråde (ingen “new”) */}
              {threadChoices.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Tråde</div>
                  <div className={styles.topicButtons}>
                    {threadChoices.map((c: any) => (
                      <button
                        key={c.id}
                        className={styles.topicBtn}
                        onClick={() => {
                          appendUserMessage(c.label)
                          dispatch({ type: "FREE_TEXT", text: c.id })
                        }}
                        disabled={loading || !state}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* HOME: emner */}
              {topicButtons.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Emner</div>
                  <div className={styles.topicButtons}>
                    {topicButtons.map((t) => (
                      <button
                        key={t.id}
                        className={styles.topicBtn}
                        onClick={() => go(t.id)}
                        disabled={!t.enabled || loading || !state}
                        title={t.tooltip}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TRIAGE chips */}
              {triageChips.length > 0 && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Forslag</div>
                  <div className={styles.chips}>
                    {triageChips.map((chip: any) => (
                      <button
                        key={chip.id}
                        className={styles.chip}
                        onClick={() => {
                          appendUserMessage(chip.label)
                          dispatch({ type: "FREE_TEXT", text: chip.label })
                        }}
                        disabled={loading || !state}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {insightsOpen && (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionTitle}>Insights</div>
                  <div className={styles.insightsBox}>
                    {insightsLoading && <div>Henter…</div>}
                    {insightsError && <div className={styles.errorText}>{insightsError}</div>}
                    {!insightsLoading && !insightsError && (
                      <pre className={styles.pre}>{JSON.stringify(insightsPayload, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className={styles.footer}>
              <div className={styles.inputRow}>
                <textarea
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  disabled={loading || !state || !freeTextEnabled}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      const text = input.trim()
                      if (!text) return
                      setInput("")
                      dispatch({ type: "FREE_TEXT", text })
                    }
                  }}
                />

                <button
                  className={styles.sendBtnIcon}
                  onClick={() => {
                    const text = input.trim()
                    if (!text) return
                    setInput("")
                    dispatch({ type: "FREE_TEXT", text })
                  }}
                  disabled={loading || !state || !freeTextEnabled || !input.trim()}
                  title="Send"
                  aria-label="Send"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        className={styles.fab}
        onClick={() => {
          setOpen(true)
          if (!state) init()
        }}
        title="Åbn chat"
        aria-label="Åbn chat"
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
      </button>
    </>
  )
}
