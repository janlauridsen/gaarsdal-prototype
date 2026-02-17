"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  InformationCircleIcon,
  CircleStackIcon,
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
  transition?: any
  log?: any
}

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

type ThreadChoice = {
  id: string
  label: string
  kind: "continue" | "new" | "thread"
}

const NODE_LABELS: Record<string, string> = {
  THREAD_CHOOSER: "Tråde",
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
}

const TOPIC_TOOLTIPS: Record<string, string> = {
  GEN_HYPNO: "Fri samtale med viden og erfaring (ingen behandling i chatten).",
  TRIAGE: "Kort afklaring: få spørgsmål og relevansvurdering for din situation.",
  METHOD_FIT:
    "Sammenlign retninger: hypnoterapi vs typiske alternativer (overblik, ikke behandling).",
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

function safeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [state, setState] = useState<ConversationState | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const didAutoStartNewThreadRef = useRef(false)

  function metaValue(key: string) {
    const entry = state?.meta?.[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const activeNodeLabel = useMemo(() => {
    if (!state) return "Initialiserer…"
    return NODE_LABELS[state.active_node] ?? state.active_node
  }, [state])

  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (state.active_node === "THREAD_CHOOSER") return "Vælg en tråd…"
    return "Skriv her… (Enter = send, Shift+Enter = ny linje)"
  }, [state])

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    return true
  }, [state])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, headerNavHint, expanded])

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
    const message = (text ?? "").trim()
    if (!message) return

    setMessages((prev) => {
      const last = prev.length ? prev[prev.length - 1] : null
      if (last && last.role === "assistant" && last.text.trim() === message) return prev
      return [...prev, { id: `assistant-${safeId()}`, role: "assistant", text: message }]
    })
  }

  function appendUserMessage(text: string) {
    const message = (text ?? "").trim()
    if (!message) return
    appendMessage({ id: `user-${safeId()}`, role: "user", text: message })
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

  async function callKernel(nextState: ConversationState | null, nextInput: InputSignal) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: nextState, input: nextInput }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Chat: HTTP ${res.status}${body ? ` — ${body}` : ""}`)
    }
    const data: KernelResponse = await res.json()
    if (!data?.state) throw new Error("Chat: mangler state i svar")
    return data
  }

  function normalizeAssistantMessage(s: ConversationState) {
    // Backend default tekst nævner 'continue', selv når der ingen tråde findes.
    if (s.active_node === "THREAD_CHOOSER") {
      const count = Number((s.meta?.["threads.count"]?.value ?? s.meta?.["threads.count"]) ?? 0)
      if (!Number.isNaN(count) && count <= 0) return "Ingen tidligere tråde. Starter en ny tråd."
      return "Vælg en tråd, eller start en ny."
    }
    return s.active_node_message
  }

  async function init() {
    setLoading(true)
    didAutoStartNewThreadRef.current = false

    try {
      const data = await callKernel(null, { type: "SYSTEM_INIT" })
      setState(data.state)
      setMessages([])
      setInput("")
      setHeaderNavHint(null)
      appendAssistantMessage(normalizeAssistantMessage(data.state))
    } finally {
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal, opts?: { silentUser?: boolean }) {
    if (!state) return
    setLoading(true)

    try {
      const fromNode = state.active_node
      const data = await callKernel(state, nextInput)

      if (nextInput.type === "EXPLICIT_TRANSITION") {
        const fromLabel = NODE_LABELS[fromNode] ?? fromNode
        const toNode = data?.state?.active_node ?? nextInput.target
        const toLabel = NODE_LABELS[toNode] ?? toNode
        showHeaderNavHint(`${fromLabel} → ${toLabel}`)
      } else if (nextInput.type === "FREE_TEXT" && !opts?.silentUser) {
        appendUserMessage(nextInput.text)
      }

      setState(data.state)
      const assistantText =
        (data.transition?.response_message as string | undefined) ?? normalizeAssistantMessage(data.state)
      appendAssistantMessage(assistantText)
    } finally {
      setLoading(false)
    }
  }

  function openChat() {
    setOpen(true)
    if (!state) init()
  }

  function closeChat() {
    setOpen(false)
    setExpanded(false)
  }

  function toggleExpanded() {
    setExpanded((v) => !v)
  }

  function go(target: string) {
    if (!state) return

    const goingFromHomeToTopic = state.active_node === "HOME" && target !== "HOME"
    if (goingFromHomeToTopic) {
      const label = NODE_LABELS[target] ?? target
      appendUserMessage(label)
    }

    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  // “Tråde” i header er et “reset til lobby”, så man altid kan vælge tråd.
  function goToThreadChooser() {
    setMessages([])
    setInput("")
    setState(null)
    setHeaderNavHint(null)
    didAutoStartNewThreadRef.current = false
    init()
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
  const threadCountRaw = metaValue("threads.count")
  const threadCount = typeof threadCountRaw === "number" ? threadCountRaw : Number(threadCountRaw ?? 0)

  const threadChoices: ThreadChoice[] =
    state?.active_node === "THREAD_CHOOSER" && Array.isArray(threadChoicesRaw)
      ? (threadChoicesRaw as any[])
          .filter((c) => c && typeof c.id === "string" && typeof c.label === "string" && typeof c.kind === "string")
          .slice(0, 12)
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

  // Auto: hvis der ingen tråde er, start ny tråd uden at brugeren skal skrive “new”.
  useEffect(() => {
    if (!open) return
    if (!state) return
    if (state.active_node !== "THREAD_CHOOSER") return
    if (didAutoStartNewThreadRef.current) return
    if (!Number.isFinite(threadCount) || threadCount > 0) return

    didAutoStartNewThreadRef.current = true
    ;(async () => {
      try {
        await dispatch({ type: "FREE_TEXT", text: "new" }, { silentUser: true })
      } catch {
        // ingen-op
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state?.active_node, threadCount])

  const containerClass = `${styles.chatbot} ${expanded ? styles.expanded : styles.normal}`

  return (
    <>
      {!open && (
        <button className={styles.fab} onClick={openChat} aria-label="Åbn chat" title="Åbn chat">
          <ChatBubbleOvalLeftEllipsisIcon className={styles.fabIcon} />
        </button>
      )}

      {open && (
        <>
          <div className={styles.overlay} onClick={closeChat} />

          <div className={containerClass} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className={styles.header}>
              <div className={styles.headerRow}>
                <div className={styles.headerLeft}>
                  <div className={styles.title}>Gaarsdal Chat</div>
                  <div className={styles.node}>{activeNodeLabel}</div>
                </div>

                <div className={styles.headerRight}>
                  <button className={styles.iconBtn} onClick={goToThreadChooser} title="Tråde" aria-label="Tråde">
                    <CircleStackIcon className={styles.icon} />
                  </button>

                  <button
                    className={styles.iconBtn}
                    onClick={() => appendAssistantMessage("(Info er ikke aktiveret i UI endnu.)")}
                    title="Info"
                    aria-label="Info"
                  >
                    <InformationCircleIcon className={styles.icon} />
                  </button>

                  <button
                    className={styles.iconBtn}
                    onClick={toggleExpanded}
                    title={expanded ? "Minimer" : "Maksimer"}
                    aria-label={expanded ? "Minimer" : "Maksimer"}
                  >
                    {expanded ? <ArrowsPointingInIcon className={styles.icon} /> : <ArrowsPointingOutIcon className={styles.icon} />}
                  </button>

                  <button className={styles.iconBtn} onClick={closeChat} title="Luk" aria-label="Luk">
                    <XMarkIcon className={styles.icon} />
                  </button>
                </div>
              </div>

              {headerNavHint && (
                <div className={styles.navHint}>
                  <span className={styles.navHintPulse}>{headerNavHint}</span>
                </div>
              )}
            </div>

            <div className={styles.messages}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}
                >
                  {m.text}
                </div>
              ))}

              {state?.active_node === "THREAD_CHOOSER" && threadChoices.length > 0 && (
                <div className="mt-3">
                  <div className={styles.sectionTitle}>Tråde</div>
                  <div className={styles.topicGrid}>
                    {threadChoices
                      .map((c) => ({
                        ...c,
                        uiLabel:
                          c.kind === "new"
                            ? "Ny tråd"
                            : c.kind === "continue"
                              ? "Fortsæt seneste tråd"
                              : c.label,
                      }))
                      .sort((a, b) => {
                        const rank = (k: ThreadChoice["kind"]) => (k === "new" ? 0 : k === "continue" ? 1 : 2)
                        return rank(a.kind) - rank(b.kind)
                      })
                      .filter((c) => {
                        if (threadCount <= 0 && c.kind === "continue") return false
                        return true
                      })
                      .map((c) => (
                        <button
                          key={c.id}
                          className={styles.topicCard}
                          onClick={() => dispatch({ type: "FREE_TEXT", text: c.id }, { silentUser: true })}
                          disabled={loading || !state}
                          title={c.kind === "thread" ? c.label : ""}
                        >
                          <span className={styles.topicLabel}>{(c as any).uiLabel}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {topicButtons.length > 0 && (
                <div className="mt-3">
                  <div className={styles.sectionTitle}>Emner</div>
                  <div className={styles.topicGrid}>
                    {topicButtons.map((t) => (
                      <button
                        key={t.id}
                        className={styles.topicCard}
                        onClick={() => go(t.id)}
                        disabled={!t.enabled || loading || !state}
                        title={t.tooltip}
                      >
                        <span className={styles.topicLabel}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {triageChips.length > 0 && (
                <div className="mt-3">
                  <div className={styles.sectionTitle}>Forslag</div>
                  <div className={styles.chipGroup}>
                    {triageChips.map((chip: any) => (
                      <button
                        key={chip.id}
                        className={styles.chip}
                        onClick={() => dispatch({ type: "FREE_TEXT", text: chip.label }, { silentUser: true })}
                        disabled={loading || !state}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className={styles.footer}>
              <div className={styles.inputRow}>
                <textarea
                  className={styles.textarea}
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
                  className={styles.sendBtn}
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
                  <PaperAirplaneIcon className={styles.sendIcon} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
