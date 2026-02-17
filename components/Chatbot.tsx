"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  WrenchScrewdriverIcon,
  HeartIcon,
  CircleStackIcon,
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

const TOPIC_NODES = [
  "GEN_HYPNO",
  "TRIAGE",
  "METHOD_FIT",
  "BOOKING",
  "DEV_SANDBOX_INTRO",
  "MAIL",
  "TLF",
  "CONTACT_FORM",
  "AKUT",
] as const

function isThreadChooserCommand(text: string) {
  const t = text.trim().toLowerCase()
  if (t === "new" || t === "ny") return true
  if (t === "continue" || t === "fortsæt") return true
  if (t.startsWith("c:")) return true
  return false
}

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

  const [sandboxForm, setSandboxForm] = useState({
    topic: "",
    goal: "",
    time_patterns: "",
    situational_triggers: "",
    relational_patterns: "",
    preferred_tone: "",
    support_direction: "",
    interest_in_methods: "",
  })
  const [sandboxAdvanced, setSandboxAdvanced] = useState(false)
  const [sandboxError, setSandboxError] = useState<string | null>(null)

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)

  function metaValue(key: string) {
    const entry = state?.meta?.[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const activeNodeLabel = state ? NODE_LABELS[state.active_node] ?? state.active_node : "Initialiserer…"

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    if (state.active_node === "THREAD_CHOOSER") return true
    if (state.active_node === "HOME") return true
    return true
  }, [state])

  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (state.active_node === "THREAD_CHOOSER") return "Skriv 'continue' eller 'new'…"
    if (state.active_node === "DEV_SANDBOX_FORM") return "Udfyld felterne eller brug eksemplet…"
    return "Skriv her… (Enter = send, Shift+Enter = ny linje)"
  }, [state, freeTextEnabled])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, headerNavHint, expanded, insightsOpen])

  useEffect(() => {
    if (!state) return
    if (state.active_node !== "DEV_SANDBOX_FORM") return

    const last = metaValue("form.last")
    const values = last && typeof last === "object" ? (last as any).values : null
    if (values && typeof values === "object") {
      setSandboxForm((prev) => ({
        ...prev,
        topic: typeof values.topic === "string" ? values.topic : prev.topic,
        goal: typeof values.goal === "string" ? values.goal : prev.goal,
        time_patterns: typeof values.time_patterns === "string" ? values.time_patterns : prev.time_patterns,
        situational_triggers:
          typeof values.situational_triggers === "string"
            ? values.situational_triggers
            : prev.situational_triggers,
        relational_patterns:
          typeof values.relational_patterns === "string" ? values.relational_patterns : prev.relational_patterns,
        preferred_tone:
          typeof values.preferred_tone === "string" ? values.preferred_tone : prev.preferred_tone,
        support_direction:
          typeof values.support_direction === "string" ? values.support_direction : prev.support_direction,
        interest_in_methods:
          typeof values.interest_in_methods === "string"
            ? values.interest_in_methods
            : prev.interest_in_methods,
      }))
    }
  }, [state?.active_node])

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

    // Undgå simpel duplikat af sidste assistant-linje
    setMessages((prev) => {
      const last = prev.length ? prev[prev.length - 1] : null
      if (last && last.role === "assistant" && last.text.trim() === message) return prev
      return [
        ...prev,
        { id: `assistant-${Date.now()}-${Math.random()}`, role: "assistant", text: message },
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
    }, 3200)
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
      setHeaderNavHint(null)
      setSandboxError(null)
      appendAssistantMessage(data.state.active_node_message)
    } finally {
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal) {
    if (!state) return

    setLoading(true)
    try {
      const fromNode = state.active_node

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, input: nextInput }),
      })

      const data: KernelResponse = await res.json()

      if (nextInput.type === "EXPLICIT_TRANSITION") {
        const fromLabel = NODE_LABELS[fromNode] ?? fromNode
        const toNode = data?.state?.active_node ?? nextInput.target
        const toLabel = NODE_LABELS[toNode] ?? toNode
        showHeaderNavHint(`${fromLabel} → ${toLabel}`)
      } else if (nextInput.type === "FREE_TEXT") {
        const suppress = fromNode === "THREAD_CHOOSER" && isThreadChooserCommand(nextInput.text)
        if (!suppress) {
          appendUserMessage(nextInput.text)
        }
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

  function reset() {
    setMessages([])
    setInput("")
    setState(null)
    setHeaderNavHint(null)
    setSandboxError(null)
    setExpanded(false)
    closeInsights()
    init()
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

  function toggleExpanded() {
    setExpanded((v) => !v)
  }

  function toggleInsights() {
    if (insightsOpen) closeInsights()
    else openInsights()
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

  const showSandboxFooter =
    state?.active_node === "DEV_SANDBOX_INTRO" ||
    state?.active_node === "DEV_SANDBOX_FORM" ||
    state?.active_node === "DEV_SANDBOX_DONE"

  const containerClass = `${styles.chatbot} ${expanded ? styles.expanded : styles.normal}`

  function applySandboxExample() {
    setSandboxForm({
      topic: "alkohol om aftenen",
      goal: "drikke mindre og stoppe tidligere",
      time_patterns: "typisk efter kl. 20, især i weekenden",
      situational_triggers: "arbejdsstress, uro i kroppen, 'skal lige slappe af'",
      relational_patterns: "drikker mere når jeg er alene; mindre hvis jeg er sammen med andre",
      preferred_tone: "rolig, konkret og uden moral",
      support_direction: "et alternativt 'afkoblings-ritual' før jeg kommer hjem",
      interest_in_methods: "gåtur; registrering; pause før første glas",
    })
    setSandboxError(null)
  }

  return (
    <>
      {/* Overlay + dialog renderes kun når open === true */}
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
            <div className={`${styles.header} flex items-center justify-between gap-3`}>
              <div className="min-w-0">
                <div className={styles.titleRow}>
                  <div className={styles.title}>Gaarsdal Chat</div>
                  <div className={styles.nodeLabel}>{activeNodeLabel}</div>
                </div>

                {headerNavHint && <div className={styles.headerHint}>{headerNavHint}</div>}
              </div>

              <div className="flex items-center gap-2">
                <button className={styles.iconBtn} onClick={toggleInsights} title="Insights">
                  <InformationCircleIcon className="w-5 h-5" />
                </button>

                <button className={styles.iconBtn} onClick={reset} title="Reset">
                  <ClipboardDocumentCheckIcon className="w-5 h-5" />
                </button>

                <button
                  className={styles.iconBtn}
                  onClick={toggleExpanded}
                  title={expanded ? "Minimer" : "Maksimer"}
                >
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

              {/* THREAD_CHOOSER: vis tråde */}
              {threadChoices.length > 0 && (
                <div className="mt-3">
                  <div className={styles.sectionTitle}>Tråde</div>
                  <div className={styles.topicButtons}>
                    {threadChoices.map((c: any) => (
                      <button
                        key={c.id}
                        className={styles.topicBtn}
                        onClick={() => {
                          // Vis label, send teknisk id (uden "new" som ekstra user message)
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
                <div className="mt-3">
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
                <div className="mt-3">
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
                <div className="mt-3">
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
              <div className={styles.footerRow}>
                <button className={styles.footerIcon} onClick={() => go("HOME")} title="Forside">
                  <HomeIcon className="w-5 h-5" />
                </button>
                <button className={styles.footerIcon} onClick={() => go("TLF")} title="Telefon">
                  <PhoneIcon className="w-5 h-5" />
                </button>
                <button className={styles.footerIcon} onClick={() => go("MAIL")} title="E-mail">
                  <EnvelopeIcon className="w-5 h-5" />
                </button>
                <button className={styles.footerIcon} onClick={() => go("CONTACT_FORM")} title="Kontaktformular">
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button className={styles.footerIcon} onClick={() => go("AKUT")} title="Akut">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </button>
              </div>

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
                  className={styles.sendBtn}
                  onClick={() => {
                    const text = input.trim()
                    if (!text) return
                    setInput("")
                    dispatch({ type: "FREE_TEXT", text })
                  }}
                  disabled={loading || !state || !freeTextEnabled || !input.trim()}
                  title="Send"
                >
                  Send
                </button>
              </div>

              {showSandboxFooter && (
                <div className={styles.sandboxFooter}>
                  <div className={styles.sectionTitle}>Sandbox</div>

                  <div className={styles.sandboxGrid}>
                    <button
                      className={styles.sandboxBtn}
                      onClick={() => go("DEV_SANDBOX_INTRO")}
                      disabled={loading || !state}
                      title="Intro"
                    >
                      <Squares2X2Icon className="w-5 h-5" />
                      Intro
                    </button>

                    <button
                      className={styles.sandboxBtn}
                      onClick={() => go("DEV_SANDBOX_FORM")}
                      disabled={loading || !state}
                      title="Form"
                    >
                      <CalendarDaysIcon className="w-5 h-5" />
                      Form
                    </button>

                    <button
                      className={styles.sandboxBtn}
                      onClick={applySandboxExample}
                      disabled={loading || !state}
                      title="Indsæt eksempel"
                    >
                      <WrenchScrewdriverIcon className="w-5 h-5" />
                      Eksempel
                    </button>

                    <button
                      className={styles.sandboxBtn}
                      onClick={() => setSandboxAdvanced((v) => !v)}
                      disabled={loading || !state}
                      title="Avanceret"
                    >
                      <HeartIcon className="w-5 h-5" />
                      {sandboxAdvanced ? "Basic" : "Avanceret"}
                    </button>

                    <button
                      className={styles.sandboxBtn}
                      onClick={() => go("HOME")}
                      disabled={loading || !state}
                      title="Tilbage til forsiden"
                    >
                      <CircleStackIcon className="w-5 h-5" />
                      Tilbage
                    </button>
                  </div>

                  {sandboxError && <div className={styles.errorText}>{sandboxError}</div>}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating launcher button er altid synlig */}
      <button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-[#4A5D54]"
        onClick={() => {
          setOpen(true)
          if (!state) init()
        }}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7 text-white" />
      </button>
    </>
  )
}
