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
  { id: "stop", label: "Stop her" },
]

const TOPIC_NODES: string[] = ["GEN_HYPNO", "TRIAGE", "METHOD_FIT", "BOOKING", "DEV_SANDBOX_INTRO"]

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
    case "DEV_SANDBOX_INTRO":
      return <WrenchScrewdriverIcon className="w-5 h-5" />
    default:
      return <InformationCircleIcon className="w-5 h-5" />
  }
}

function hasAnyUserMessage(messages: ChatMessage[]): boolean {
  return messages.some((m) => m.role === "user" && m.text.trim().length > 0)
}

function readMetaNumber(state: ConversationState | null, key: string): number {
  const raw = state?.meta?.[key]?.value
  return typeof raw === "number" ? raw : 0
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

  const activeNodeLabel = state ? NODE_LABELS[state.active_node] ?? state.active_node : "Initialiserer…"

  const freeTextEnabled = useMemo(() => {
    // “Fritekst igen”: UI tillader alt, men backend kan stadig REJECT’e afhængigt af node/kind.
    // Dette matcher retningen om en mere data-drevet router senere.
    return true
  }, [])

  const inputPlaceholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (!freeTextEnabled) return "Vælg et forslag eller navigation…"
    return "Skriv her… (Enter = send, Shift+Enter = ny linje)"
  }, [state, freeTextEnabled])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open, headerNavHint, expanded, insightsOpen])

  useEffect(() => {
    if (!state) return
    if (state.active_node !== "DEV_SANDBOX_FORM") return

    // Seed defaults fra sidste submit hvis den findes i state.meta
    const last = state?.meta?.["form.last"]?.value
    const values = last && typeof last === "object" ? (last as any).values : null
    if (values && typeof values === "object") {
      setSandboxForm((prev) => ({
        ...prev,
        topic: typeof values.topic === "string" ? values.topic : prev.topic,
        goal: typeof values.goal === "string" ? values.goal : prev.goal,
        time_patterns: typeof values.time_patterns === "string" ? values.time_patterns : prev.time_patterns,
        situational_triggers: typeof values.situational_triggers === "string" ? values.situational_triggers : prev.situational_triggers,
        relational_patterns: typeof values.relational_patterns === "string" ? values.relational_patterns : prev.relational_patterns,
        preferred_tone: typeof values.preferred_tone === "string" ? values.preferred_tone : prev.preferred_tone,
        support_direction: typeof values.support_direction === "string" ? values.support_direction : prev.support_direction,
        interest_in_methods: typeof values.interest_in_methods === "string" ? values.interest_in_methods : prev.interest_in_methods,
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setInsightsPayload(json)
    } catch (e: any) {
      setInsightsError(typeof e?.message === "string" ? e.message : "Kunne ikke hente data")
    } finally {
      setInsightsLoading(false)
    }
  }

  function resetConversation() {
    setInput("")
    setMessages([])
    setState(null)
    setHeaderNavHint(null)
    setSandboxError(null)
    setExpanded(false)
    closeInsights()
    init()
  }

  function go(target: string) {
    if (!state) return

    const goingFromHomeToTopic = state.active_node === "HOME" && TOPIC_NODES.includes(target)

    if (goingFromHomeToTopic && !hasAnyUserMessage(messages)) {
      setMessages([])
    }

    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  function sendFreeText() {
    if (!state) return
    if (!freeTextEnabled) return

    const text = input.trim()
    if (!text) return
    dispatch({ type: "FREE_TEXT", text })
    setInput("")
  }

  function submitSandboxForm() {
    if (!state) return
    if (state.active_node !== "DEV_SANDBOX_FORM") return

    const topic = sandboxForm.topic.trim()
    const goal = sandboxForm.goal.trim()

    if (!topic || !goal) {
      setSandboxError("Udfyld mindst: topic + goal")
      return
    }

    setSandboxError(null)

    const lines: string[] = []
    const push = (k: string, v: string) => {
      const val = v.trim()
      if (!val) return
      lines.push(`${k}: ${val}`)
    }

    push("topic", topic)
    push("goal", goal)
    push("time_patterns", sandboxForm.time_patterns)
    push("situational_triggers", sandboxForm.situational_triggers)
    push("relational_patterns", sandboxForm.relational_patterns)
    push("preferred_tone", sandboxForm.preferred_tone)
    push("support_direction", sandboxForm.support_direction)
    push("interest_in_methods", sandboxForm.interest_in_methods)

    dispatch({ type: "FREE_TEXT", text: lines.join("\n") })
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
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">Gaarsdal Chat</div>

              {loading && (
                <span className="inline-flex items-center" aria-label="Arbejder" title="Arbejder…">
                  <HeartIcon className="w-4 h-4 text-[#4A5D54] animate-pulse" />
                </span>
              )}
            </div>

            <div className={`text-xs truncate ${styles.meta}`}>{activeNodeLabel}</div>

            {headerNavHint && (
              <div className={styles.navHint} aria-live="polite">
                <span className={styles.navHintPulse}>{headerNavHint}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              className={styles.iconBtn}
              aria-label="Data"
              title="Data og præferencer"
              onClick={openInsights}
              disabled={loading}
            >
              <CircleStackIcon className="w-5 h-5" />
            </button>

            <button
              className={styles.iconBtn}
              aria-label={expanded ? "Formindsk" : "Forstør"}
              title={expanded ? "Formindsk" : "Forstør"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
            </button>

            <button
              className={styles.iconBtn}
              aria-label="Ny samtale"
              title="Ny samtale"
              onClick={resetConversation}
              disabled={loading}
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
            </button>

            <button
              className={styles.iconBtn}
              aria-label="Luk"
              title="Luk"
              onClick={() => {
                closeInsights()
                setOpen(false)
              }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
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

          {state?.active_node === "TRIAGE" && triageChips.length > 0 && (
            <div className="mt-3">
              <div className={styles.sectionTitle}>Forslag</div>
              <div className={styles.chipGroup}>
                {triageChips.map((chip: any) => (
                  <button key={chip.id} className={styles.chip} onClick={() => handleTriageChip(chip)} disabled={loading || !state}>
                    {chip.label}
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
                    onClick={() => go(t.id)}
                    disabled={!t.enabled || loading || !state}
                    title={t.tooltip || (!t.enabled ? "Ikke tilgængelig herfra" : "")}
                    className={styles.topicCard}
                  >
                    <span className={styles.topicIcon}>{getTopicIcon(t.id)}</span>
                    <span className={styles.topicLabel}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        <div className={styles.footer}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1">
              <button className={styles.iconBtn} aria-label="Forside" title="Forside" onClick={() => state && go("HOME")} disabled={!state || loading}>
                <HomeIcon className="w-5 h-5" />
              </button>

              <button className={styles.iconBtn} aria-label="Telefon" title="Telefon" onClick={() => state && go("TLF")} disabled={!state || loading}>
                <PhoneIcon className="w-5 h-5" />
              </button>

              <button className={styles.iconBtn} aria-label="E-mail" title="E-mail" onClick={() => state && go("MAIL")} disabled={!state || loading}>
                <EnvelopeIcon className="w-5 h-5" />
              </button>

              <button className={styles.iconBtn} aria-label="Kontaktformular" title="Kontaktformular" onClick={openContactForm}>
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center">
              <button className={styles.iconBtn} aria-label="Akut" title="Akut" onClick={() => state && go("AKUT")} disabled={!state || loading}>
                <ExclamationTriangleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showSandboxFooter ? (
            <div className={styles.sandboxFooter}>
              {state?.active_node === "DEV_SANDBOX_INTRO" && (
                <div className={styles.sandboxCta}>
                  <button
                    className={styles.btn}
                    onClick={() => state && go("DEV_SANDBOX_FORM")}
                    disabled={!state || loading}
                  >
                    Start sandbox-form
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={applySandboxExample}
                    disabled={!state || loading}
                  >
                    Indsæt eksempel
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnGhost}`}
                    onClick={() => setSandboxAdvanced((v) => !v)}
                    disabled={!state || loading}
                  >
                    {sandboxAdvanced ? "Skjul rå input" : "Vis rå input"}
                  </button>
                </div>
              )}

              {state?.active_node === "DEV_SANDBOX_FORM" && (
                <div>
                  <div className={styles.sectionTitle}>Sandbox form</div>

                  <div className={styles.formGrid}>
                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Topic *</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.topic}
                        onChange={(e) => {
                          setSandboxError(null)
                          setSandboxForm((p) => ({ ...p, topic: e.target.value }))
                        }}
                        placeholder="fx alkohol om aftenen"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Goal *</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.goal}
                        onChange={(e) => {
                          setSandboxError(null)
                          setSandboxForm((p) => ({ ...p, goal: e.target.value }))
                        }}
                        placeholder="fx drikke mindre"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Time patterns</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.time_patterns}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, time_patterns: e.target.value }))}
                        placeholder="fx aftenen"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Situational triggers</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.situational_triggers}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, situational_triggers: e.target.value }))}
                        placeholder="fx arbejdsstress"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Relational patterns</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.relational_patterns}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, relational_patterns: e.target.value }))}
                        placeholder="fx familien"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Preferred tone</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.preferred_tone}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, preferred_tone: e.target.value }))}
                        placeholder="fx rolig og direkte"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Support direction</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.support_direction}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, support_direction: e.target.value }))}
                        placeholder="fx ro før jeg kommer hjem"
                        disabled={!state || loading}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.fieldLabel}>Interest in methods</span>
                      <input
                        className={styles.input}
                        value={sandboxForm.interest_in_methods}
                        onChange={(e) => setSandboxForm((p) => ({ ...p, interest_in_methods: e.target.value }))}
                        placeholder="fx gåtur; pause; registrering"
                        disabled={!state || loading}
                      />
                    </label>
                  </div>

                  <div className={`${styles.sandboxCta} mt-2`}>
                    <button className={styles.btn} onClick={submitSandboxForm} disabled={!state || loading}>
                      Gem og kør tool
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={applySandboxExample}
                      disabled={!state || loading}
                    >
                      Indsæt eksempel
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => setSandboxAdvanced((v) => !v)}
                      disabled={!state || loading}
                    >
                      {sandboxAdvanced ? "Skjul rå input" : "Vis rå input"}
                    </button>
                  </div>

                  {sandboxError && <div className={styles.formError}>{sandboxError}</div>}

                  {sandboxAdvanced && (
                    <div className="mt-2">
                      <div className={styles.sectionTitle}>Rå input (key:value)</div>
                      <textarea
                        className={styles.textarea}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={inputPlaceholder}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendFreeText()
                          }
                        }}
                        disabled={!state || loading || !freeTextEnabled}
                      />
                    </div>
                  )}
                </div>
              )}

              {state?.active_node === "DEV_SANDBOX_DONE" && (
                <div className={styles.sandboxCta}>
                  <button className={styles.btn} onClick={() => state && go("HOME")} disabled={!state || loading}>
                    Tilbage til forside
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <textarea
                className={styles.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={inputPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendFreeText()
                  }
                }}
                disabled={!state || loading || !freeTextEnabled}
              />
            </div>
          )}
        </div>

        {insightsOpen && (
          <div className={styles.modalOverlay} onClick={closeInsights}>
            <div
              className={styles.modal}
              role="dialog"
              aria-modal="true"
              aria-label="Data og præferencer"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>Data og præferencer</div>
                <button className={styles.iconBtn} aria-label="Luk" title="Luk" onClick={closeInsights}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.modalBody}>
                {insightsLoading && <div className={`text-sm ${styles.meta}`}>Henter…</div>}

                {!insightsLoading && insightsError && (
                  <div className="text-sm">Kunne ikke hente data: {insightsError}</div>
                )}

                {!insightsLoading && !insightsError && (
                  <pre className={styles.pre}>{JSON.stringify(insightsPayload ?? {}, null, 2)}</pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
