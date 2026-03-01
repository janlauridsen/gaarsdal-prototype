"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlusIcon,
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
  | { type: "UI_ACTION"; action: "TLF" | "MAIL" | "AKUT" | "CONTACT_FORM" }
  | { type: "FREE_TEXT"; text: string }
  | { type: "SYSTEM_INIT" }
  | {
      type: "THREAD_CREATE"
      mode: "normal"
      thread_type?: "chat" | "journal"
      journal_profile?: "alcohol" | "general" | "strict"
      journal_init?: {
        title: string
        problem: string
        goal: string
      }
    }
  | { type: "THREAD_SWITCH"; conversation_id: string }
  | { type: "THREAD_ARCHIVE" }

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

type UiSuggestion = {
  id: string
  label: string
  input?: any
}

type ThreadChoice = {
  id: string
  label: string
  kind: "continue" | "new" | "thread"
}

type ThreadTab = {
  conversation_id: string
  title: string
  preview: string
  status: "active" | "archived"
  thread_type?: "chat" | "journal"
  journal_profile?: "alcohol" | "general" | "strict"
  // Legacy support (older stored items)
  journal_kind?: "alcohol"
  updated_at?: string
}

function formatThreadPreview(t: ThreadTab): string {
  const raw = (t.preview || "").trim()
  if (!raw) return ""

  if (t.thread_type === "journal") {
    try {
      const obj = JSON.parse(raw)
      const text = String(obj?.text || "").trim()
      const parts: string[] = []
      if (typeof obj?.drinks === "number") parts.push(`Drinks: ${obj.drinks}`)
      if (typeof obj?.urge_0_10 === "number") parts.push(`Urge: ${obj.urge_0_10}/10`)
      if (typeof obj?.sleep_h === "number") parts.push(`Søvn: ${obj.sleep_h}t`)
      const suffix = parts.length ? ` • ${parts.join(" • ")}` : ""
      return (text || "(notat)") + suffix
    } catch {
      // fall back to raw
      return raw
    }
  }

  return raw
}

type JournalEntry = {
  entry_id: string
  ts_ms: number
  schema_version: "v1" | "v2"
  kind: "alcohol" | "general" | "strict"
  text?: string
  fields?: {
    drinks?: number
    urge_0_10?: number
    strict_0_10?: number

    // alcohol v2 (optional)
    mood_tag?: string
    mood_0_10?: number
    trigger_tag?: string
    context_tag?: string
    coping_tag?: string
    action?: string
    craving_peak_0_10?: number
    craving_duration_min?: number
  }
}

const NODE_LABELS: Record<string, string> = {
  THREAD_CHOOSER: "Tråde",
  HOME: "Forside",
  GEN_HYPNO: "Spørg om hypnoterapi…",
  TRIAGE: "Passer hypnoterapi til min situation?",
  METHOD_FIT: "Hypnoterapi eller et bedre alternativ?",
  REFLECTION: "Refleksion",
  DAGBOG: "Dagbog",
  BOOKING: "Book tid",
  DEV_SANDBOX_INTRO: "Sandbox (dev)",
  MAIL: "E-mail",
  TLF: "Telefon",
  CONTACT_FORM: "Kontakt",
  AKUT: "Akut",
}

// (Topic menu removed)

function safeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function trimDuplicateTitle(s: string) {
  // Håndter "x — x" (dobbelt titel)
  const parts = s.split("—").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0]
  return s.trim()
}

function splitThreadLabel(label: string): { title: string; preview: string } {
  const cleaned = trimDuplicateTitle(label || "").trim()
  if (!cleaned) return { title: "", preview: "" }

  // Thread labels are generated as: "<title> — <preview>".
  // Use the first em-dash as separator, keep the rest in preview.
  const idx = cleaned.indexOf("—")
  if (idx < 0) return { title: cleaned, preview: "" }

  const title = cleaned.slice(0, idx).trim()
  const preview = cleaned.slice(idx + 1).trim()
  if (!title) return { title: cleaned, preview: "" }
  return { title, preview }
}


function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Chatbot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [threadsOpen, setThreadsOpen] = useState(false)

  const [journalWizardOpen, setJournalWizardOpen] = useState(false)
  const [journalWizardStep, setJournalWizardStep] = useState<1 | 2 | 3>(1)
  const [journalWizardProfile, setJournalWizardProfile] = useState<"alcohol" | "general" | "strict" | null>(null)
  const [journalWizardTitle, setJournalWizardTitle] = useState("")
  const [journalWizardProblem, setJournalWizardProblem] = useState("")
  const [journalWizardGoal, setJournalWizardGoal] = useState("")

  const [state, setState] = useState<ConversationState | null>(null)
  // Messages are cached per conversation id (tabs).
  const [messagesByConversationId, setMessagesByConversationId] = useState<Record<string, ChatMessage[]>>({})
  const loadedConversationsRef = useRef<Set<string>>(new Set())
  const [input, setInput] = useState("")
  const [journalText, setJournalText] = useState("")
  const [journalDrinks, setJournalDrinks] = useState<string>("")
  const [journalUrge, setJournalUrge] = useState<string>("")
  const [journalStrict, setJournalStrict] = useState<string>("")
  const [journalAdvancedOpen, setJournalAdvancedOpen] = useState(false)
  const [journalTsLocal, setJournalTsLocal] = useState<string>("")

  // alcohol v2 optional fields
  const [journalMoodTag, setJournalMoodTag] = useState<string>("")
  const [journalMood, setJournalMood] = useState<string>("")
  const [journalTriggerTag, setJournalTriggerTag] = useState<string>("")
  const [journalContextTag, setJournalContextTag] = useState<string>("")
  const [journalCopingTag, setJournalCopingTag] = useState<string>("")
  const [journalAction, setJournalAction] = useState<string>("")
  const [journalCravingPeak, setJournalCravingPeak] = useState<string>("")
  const [journalCravingDuration, setJournalCravingDuration] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Threads overlay (drawer) lives on top of the chat view.

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const didAutoStartNewThreadRef = useRef(false)

  const focusInput = () => {
    // defer to after DOM commit
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  // Global footer actions must always be reachable, regardless of the current node's allowed_transitions.
  // (Kernel also whitelists these exits.)
  const GLOBAL_ACTIONS = useMemo(() => new Set(["HOME", "TLF", "MAIL", "CONTACT_FORM", "AKUT"]), [])

  function metaValue(key: string) {
    const entry = state?.meta?.[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const threadTabs: ThreadTab[] = useMemo(() => {
    const raw = metaValue("threads.tabs")
    return Array.isArray(raw) ? (raw as any) : []
  }, [state?.meta])

  const activeConversationId = state?.conversation_id ?? null

  const activeThread = useMemo(() => {
    if (!activeConversationId) return null
    return threadTabs.find((t) => t.conversation_id === activeConversationId) ?? null
  }, [activeConversationId, threadTabs])

  const isJournalActive = !!activeThread && (activeThread.thread_type ?? "chat") === "journal"

  const journalConfig = useMemo(() => {
    if (!isJournalActive) return null
    const raw = metaValue("journal.config")
    if (!raw || typeof raw !== "object") return null
    return raw as any
  }, [state?.meta, isJournalActive])

  const journalProfile: "alcohol" | "general" | "strict" | null = useMemo(() => {
    if (!isJournalActive) return null
    const fromConfig = typeof (journalConfig as any)?.profile === "string" ? String((journalConfig as any).profile) : ""
    if (fromConfig === "alcohol" || fromConfig === "general" || fromConfig === "strict") return fromConfig
    const fromThread = activeThread?.journal_profile
    if (fromThread === "alcohol" || fromThread === "general" || fromThread === "strict") return fromThread
    // Legacy support.
    if (activeThread?.journal_kind === "alcohol") return "alcohol"
    return "general"
  }, [isJournalActive, journalConfig, activeThread])

  const journalTitle = useMemo(() => {
    if (!isJournalActive) return ""
    const t = (activeThread?.title || "").trim()
    if (t) return t
    const c = typeof (journalConfig as any)?.title === "string" ? String((journalConfig as any).title).trim() : ""
    return c
  }, [isJournalActive, activeThread, journalConfig])

  const activeNodeLabel = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (isJournalActive) {
      const t = journalTitle || "Dagbog"
      return `Dagbog – ${t}`
    }
    const key = String(state.active_node ?? "").trim()
    return NODE_LABELS[key] ?? key
  }, [state, isJournalActive, journalTitle])

  const journalEntries: JournalEntry[] = useMemo(() => {
    if (!isJournalActive) return []
    const raw = metaValue("journal.entries")
    return Array.isArray(raw) ? (raw as any) : []
  }, [state?.meta, isJournalActive])

  function openJournalWizard() {
    setJournalWizardOpen(true)
    setJournalWizardStep(1)
    setJournalWizardProfile(null)
    setJournalWizardTitle("")
    setJournalWizardProblem("")
    setJournalWizardGoal("")
  }

  function closeJournalWizard() {
    setJournalWizardOpen(false)
    focusInput()
  }

  function canCreateJournal(): boolean {
    const active = threadTabs.filter((t) => (t.thread_type ?? "chat") === "journal" && t.status === "active")
    return active.length < 5
  }

  const visibleMessages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversationId[activeConversationId] ?? []
  }, [activeConversationId, messagesByConversationId])

  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    if (isJournalActive) return "Dagens notat…"
    return "Skriv her… (Enter = send, Shift+Enter = ny linje)"
  }, [state, isJournalActive])

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    if (loading) return false
    if (state.status === "completed" || state.status === "rejected") return false
    return true
  }, [state, loading])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages, open, headerNavHint, expanded, journalEntries])

  // Autofocus after output / state updates (and after overlays close)
  useEffect(() => {
    if (!open) return
    if (!state) return
    if (loading) return
    if (threadsOpen) return
    if (journalWizardOpen) return
    focusInput()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    loading,
    threadsOpen,
    journalWizardOpen,
    state?.revision,
    visibleMessages.length,
    journalEntries.length,
    isJournalActive,
  ])

  // (Loading indicator is shown in header as a blinking heart.)

  useEffect(() => {
    return () => {
      if (headerNavHintTimerRef.current) {
        window.clearTimeout(headerNavHintTimerRef.current)
        headerNavHintTimerRef.current = null
      }
    }
  }, [])

  function appendAssistantMessage(conversationId: string, text: string) {
    const message = (text ?? "").trim()
    if (!message) return

    setMessagesByConversationId((prev) => {
      const current = prev[conversationId] ?? []
      const last = current.length ? current[current.length - 1] : null
      if (last && last.role === "assistant" && last.text.trim() === message) return prev
      return { ...prev, [conversationId]: [...current, { id: `assistant-${safeId()}`, role: "assistant", text: message }] }
    })
  }

  function appendUserMessage(conversationId: string, text: string) {
    const message = (text ?? "").trim()
    if (!message) return
    setMessagesByConversationId((prev) => {
      const current = prev[conversationId] ?? []
      return { ...prev, [conversationId]: [...current, { id: `user-${safeId()}`, role: "user", text: message }] }
    })
  }

  const isThreadControlText = (t: string) => {
    const s = (t ?? "").trim().toLowerCase()
    if (!s) return false
    if (s === "continue" || s === "fortsæt" || s === "fortsaet") return true
    if (s === "new" || s === "ny") return true
    if (s.startsWith("c:")) return true
    return false
  }

  async function loadTranscript(conversationId: string): Promise<ChatMessage[]> {
    const url = `/api/transcript?conversation_id=${encodeURIComponent(conversationId)}&limit_turns=20`
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json().catch(() => null)) as any
    const msgs = Array.isArray(data?.messages) ? data.messages : []
    const out: ChatMessage[] = []
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i]
      if (!m || (m.role !== "user" && m.role !== "assistant")) continue
      const text = String(m.content ?? "").trim()
      if (!text) continue

      // Defensive filtering: do not render control pseudo-messages if they ever leak into transcript.
      if (m.role === "user") {
        if (isThreadControlText(text)) continue
        if (text.startsWith("UI_ACTION:")) continue
        if (text.startsWith("EXPLICIT_TRANSITION:")) continue
        if (text.startsWith("THREAD_")) continue
        if (text.startsWith("SYSTEM")) continue
      }

      out.push({ id: `${conversationId}:${i}:${m.role}`, role: m.role, text })
    }
    return out
  }

  async function ensureConversationLoaded(conversationId: string, s?: ConversationState) {
    if (!conversationId) return
    if (loadedConversationsRef.current.has(conversationId)) return

    const transcript = await loadTranscript(conversationId)
    loadedConversationsRef.current.add(conversationId)
    setMessagesByConversationId((prev) => ({ ...prev, [conversationId]: transcript }))

    // If there is no transcript yet, show the current node message as the first assistant bubble.
    if (!transcript.length && s) {
      const welcome = normalizeAssistantMessage(s)
      if (welcome?.trim()) {
        setMessagesByConversationId((prev) => {
          const cur = prev[conversationId] ?? []
          if (cur.length) return prev
          return { ...prev, [conversationId]: [{ id: `assistant-${safeId()}`, role: "assistant", text: welcome.trim() }] }
        })
      }
    }
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
    }, 2400)
  }

  async function callKernel(nextState: ConversationState | null, nextInput: InputSignal) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ state: nextState, input: nextInput }),
    })

    if (!res.ok) {
      // Handle expected constraints (e.g., journal limit) without throwing.
      if (res.status === 409) {
        const json = await res.json().catch(() => null)
        const msg = json?.error?.message || "Handlingen kunne ikke udføres."
        setHeaderNavHint(msg)
        // Return a no-op response so caller can decide what to do (e.g. keep wizard open).
        return { state: nextState as any, transition: null, error: json?.error || { code: "CONFLICT" } } as any
      }

      const body = await res.text().catch(() => "")
      throw new Error(`Chat: HTTP ${res.status}${body ? ` — ${body}` : ""}`)
    }

    const data: KernelResponse = await res.json()
    if (!data?.state) throw new Error("Chat: mangler state i svar")
    return data
  }

  function threadCountFromState(s: ConversationState) {
    const raw = s.meta?.["threads.count"]?.value ?? s.meta?.["threads.count"]
    const n = typeof raw === "number" ? raw : Number(raw ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  function normalizeAssistantMessage(s: ConversationState) {
    if (s.status === "completed") {
      return "Samtalen er afsluttet. Start en ny tråd eller vælg en anden."
    }

    if (s.active_node === "THREAD_CHOOSER") {
      const count = threadCountFromState(s)
      if (count <= 0) return "Starter en ny tråd…"
      return "Vælg en tråd, eller start en ny."
    }

    return s.active_node_message
  }

  async function init() {
    setLoading(true)
    didAutoStartNewThreadRef.current = false

    try {
      const data = await callKernel(null, { type: "SYSTEM_INIT" } as any)
      setState(data.state)
      setInput("")
      setHeaderNavHint(null)
      await ensureConversationLoaded(data.state.conversation_id, data.state)
    } finally {
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal, opts?: { silentUser?: boolean }): Promise<boolean> {
    if (!state) return false
    setLoading(true)

    try {
      const fromNode = state.active_node
      const data: any = await callKernel(state, nextInput)

      // Expected constraint errors (e.g., journal limit) should not mutate state or close UI.
      if (data?.error?.code) return false

      const isThreadNav =
        nextInput.type === "THREAD_CREATE" ||
        nextInput.type === "THREAD_SWITCH" ||
        nextInput.type === "THREAD_ARCHIVE"

      if (nextInput.type === "EXPLICIT_TRANSITION") {
        const fromLabel = NODE_LABELS[fromNode] ?? fromNode
        const toNode = data?.state?.active_node ?? nextInput.target
        const toLabel = NODE_LABELS[toNode] ?? toNode
        showHeaderNavHint(`${fromLabel} → ${toLabel}`)
      } else if (nextInput.type === "FREE_TEXT" && !opts?.silentUser) {
        if (!isJournalActive && state.conversation_id) appendUserMessage(state.conversation_id, nextInput.text)
      }

      setState(data.state)

      const assistantText =
        (data.transition?.response_message as string | undefined) ?? normalizeAssistantMessage(data.state)

      if (isThreadNav) {
        setInput("")
        setJournalText("")
        setJournalDrinks("")
        setJournalUrge("");
        setJournalStrict("")
        setJournalAdvancedOpen(false)
        setJournalTsLocal("");
        setJournalMoodTag("");
        setJournalMood("")
        setJournalTriggerTag("");
        setJournalContextTag("");
        setJournalCopingTag("");
        setJournalAction("");
        setJournalCravingPeak("");
        setJournalCravingDuration("");
        setHeaderNavHint(null)
        await ensureConversationLoaded(data.state.conversation_id, data.state)
      } else {
        if (!isJournalActive && state.conversation_id) {
          appendAssistantMessage(state.conversation_id, assistantText)
        } else {
          // Journal entries are rendered from state.meta; keep chat transcript clean.
          setJournalText("")
          setJournalDrinks("")
          setJournalUrge("");
          setJournalStrict("")
          setJournalTsLocal("");
          setJournalMoodTag("");
          setJournalMood("")
          setJournalTriggerTag("");
          setJournalContextTag("");
          setJournalCopingTag("");
          setJournalAction("");
          setJournalCravingPeak("");
          setJournalCravingDuration("");
        }
      }
      return true
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

  async function go(target: string) {
    if (!state) return

    const allowed = new Set(state.allowed_transitions ?? [])
    const isAllowed = allowed.has(target) || GLOBAL_ACTIONS.has(target)
    if (!isAllowed) {
      showHeaderNavHint("Ikke tilgængeligt her")
      return
    }

    const goingFromHomeToTopic = state.active_node === "HOME" && target !== "HOME"
    if (goingFromHomeToTopic) {
      const label = NODE_LABELS[target] ?? target
      if (state.conversation_id) appendUserMessage(state.conversation_id, label)
    }

    // Footer actions are UI-only and must not change active nodes.
    if (target === "TLF" || target === "MAIL" || target === "AKUT" || target === "CONTACT_FORM") {
      if (state.conversation_id) {
        if (target === "TLF") appendAssistantMessage(state.conversation_id, "Åbner telefon…")
        if (target === "MAIL") appendAssistantMessage(state.conversation_id, "Åbner e-mail…")
        if (target === "AKUT") appendAssistantMessage(state.conversation_id, "Viser akut-info…")
        if (target === "CONTACT_FORM") appendAssistantMessage(state.conversation_id, "Åbner kontaktformular…")
      }

      // Log + (optionally) render body text via backend without switching nodes.
      await dispatch({ type: "UI_ACTION", action: target as any })

      // CONTACT_FORM navigates to the dedicated page.
      if (target === "CONTACT_FORM") {
        router.push("/kontakt")
      }
      return
    }

    dispatch({ type: "EXPLICIT_TRANSITION", target })
  }

  // “Tråde” i header: tilbage til lobby / trådvalg

  const threadChoicesRaw = metaValue("threads.choices")
  const threadCount = state ? threadCountFromState(state) : 0

  const returnDepthRaw = metaValue("threads.return_depth")
  const returnDepth = Number.isFinite(Number(returnDepthRaw ?? 0)) ? Number(returnDepthRaw ?? 0) : 0

  const canArchiveThread = useMemo(() => {
    if (!state) return false
    if (loading) return false
    const cid = String(state.conversation_id ?? "")
    if (!cid) return false
    if (cid.startsWith("lobby:u:")) return false
    if (state.active_node === "THREAD_CHOOSER") return false
    return true
  }, [state, loading])

  const threadChoices: ThreadChoice[] =
    state?.active_node === "THREAD_CHOOSER" && Array.isArray(threadChoicesRaw)
      ? (threadChoicesRaw as any[])
          .filter((c) => c && typeof c.id === "string" && typeof c.label === "string" && typeof c.kind === "string")
          .slice(0, 12)
      : []

  const uiSuggestionsRaw = metaValue("ui.suggestions")
  const uiSuggestions: UiSuggestion[] = Array.isArray(uiSuggestionsRaw)
    ? (uiSuggestionsRaw as any[])
        .filter((x) => x && typeof x === "object" && typeof (x as any).label === "string")
        .slice(0, 8)
        .map((x, i) => ({
          id: String((x as any).id ?? i),
          label: String((x as any).label),
          input: (x as any).input,
        }))
    : []

  // Topic/menu structure has been removed. All dialog happens in free text.

  // Auto: hvis der ingen tråde er, start ny tråd uden at brugeren skal skrive “new”.
  useEffect(() => {
    if (!open) return
    if (!state) return
    if (state.active_node !== "THREAD_CHOOSER") return
    if (didAutoStartNewThreadRef.current) return
    if (threadCount > 0) return

    didAutoStartNewThreadRef.current = true
    ;(async () => {
      try {
        await dispatch({ type: "THREAD_CREATE", mode: "normal" }, { silentUser: true })
      } catch {
        // no-op
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, state?.active_node, threadCount])

  const containerClass = `${styles.chatbot} ${expanded ? styles.expanded : styles.normal}`

  const normalizedThreadCards = useMemo(() => {
    const base = threadChoices
      .map((c) => {
        const cleanLabel = trimDuplicateTitle(c.label)

        if (c.kind === "new") {
          return { ...c, uiLabel: "Ny tråd", uiMeta: "" }
        }

        if (c.kind === "continue") {
          // Keep the current preferred format:
          // header = "Fortsæt seneste tråd", details = full label (title — preview)
          return {
            ...c,
            uiLabel: "Fortsæt seneste tråd",
            uiMeta: trimDuplicateTitle(String(c.label ?? "").replace(/^Fortsæt:\s*/i, "")),
          }
        }

        const { title, preview } = splitThreadLabel(cleanLabel)
        return {
          ...c,
          uiLabel: title || cleanLabel || "Tråd",
          uiMeta: preview,
        }
      })
      .sort((a, b) => {
        const rank = (k: ThreadChoice["kind"]) => (k === "new" ? 0 : k === "continue" ? 1 : 2)
        return rank(a.kind) - rank(b.kind)
      })
      .filter((c) => {
        // Skjul “continue” hvis der reelt ikke er noget at fortsætte
        if (threadCount <= 0 && c.kind === "continue") return false
        return true
      })
      .filter((c) => {
        // Skjul “thread”-kort med “fjollet nummer”/tomt label
        if (c.kind !== "thread") return true
        const cleaned = trimDuplicateTitle(c.label || "")
        if (!cleaned) return false
        if (/^(tråd\s*)?\d+$/i.test(cleaned)) return false
        return true
      })

    // Hvis der kun er én tråd og “continue” i praksis er samme, kan vi skjule continue
    const hasContinue = base.some((x) => x.kind === "continue")
    const threadCards = base.filter((x) => x.kind === "thread")
    if (hasContinue && threadCards.length === 1) {
      return base.filter((x) => x.kind !== "continue")
    }
    return base
  }, [threadChoices, threadCount])

  const submitJournalEntry = () => {
    if (!state || !freeTextEnabled || loading) return

    const text = journalText.trim()
    const drinks = Number.parseInt(journalDrinks.trim(), 10)
    const urge = Number.parseInt(journalUrge.trim(), 10)
    const strict = Number.parseInt(journalStrict.trim(), 10)

    const mood0 = Number.parseInt(journalMood.trim(), 10)
    const cravingPeak = Number.parseInt(journalCravingPeak.trim(), 10)
    const cravingDur = Number.parseInt(journalCravingDuration.trim(), 10)

    const ts_ms = journalTsLocal.trim() ? new Date(journalTsLocal.trim()).getTime() : undefined

    const mood_tag = journalMoodTag.trim() || undefined
    const trigger_tag = journalTriggerTag.trim() || undefined
    const context_tag = journalContextTag.trim() || undefined
    const coping_tag = journalCopingTag.trim() || undefined
    const action = journalAction.trim() || undefined

    const hasAny =
      !!text ||
      (journalProfile === "alcohol" &&
        (Number.isFinite(drinks) ||
          Number.isFinite(urge) ||
          !!mood_tag ||
          Number.isFinite(mood0) ||
          !!trigger_tag ||
          !!context_tag ||
          !!coping_tag ||
          !!action ||
          Number.isFinite(cravingPeak) ||
          Number.isFinite(cravingDur))) ||
      (journalProfile === "strict" && Number.isFinite(strict))

    if (!hasAny) return

    const payload = JSON.stringify({
      text,
      profile: journalProfile,
      ts_ms: typeof ts_ms === "number" && Number.isFinite(ts_ms) ? ts_ms : undefined,
      drinks: journalProfile === "alcohol" && Number.isFinite(drinks) ? drinks : undefined,
      urge_0_10: journalProfile === "alcohol" && Number.isFinite(urge) ? urge : undefined,
      strict_0_10: journalProfile === "strict" && Number.isFinite(strict) ? strict : undefined,

      // alcohol v2 optional fields
      mood_tag: journalProfile === "alcohol" ? mood_tag : undefined,
      mood_0_10: journalProfile === "alcohol" && Number.isFinite(mood0) ? mood0 : undefined,
      trigger_tag: journalProfile === "alcohol" ? trigger_tag : undefined,
      context_tag: journalProfile === "alcohol" ? context_tag : undefined,
      coping_tag: journalProfile === "alcohol" ? coping_tag : undefined,
      action: journalProfile === "alcohol" ? action : undefined,
      craving_peak_0_10: journalProfile === "alcohol" && Number.isFinite(cravingPeak) ? cravingPeak : undefined,
      craving_duration_min: journalProfile === "alcohol" && Number.isFinite(cravingDur) ? cravingDur : undefined,
    })

    dispatch({ type: "FREE_TEXT", text: payload }, { silentUser: true })

    // reset local form state after submit
    setJournalText("");
    setJournalDrinks("");
    setJournalUrge("");
    setJournalMoodTag("");
    setJournalMoodValue("");
    setJournalTriggerTag("");
    setJournalContextTag("");
    setJournalCopingTag("");
    setJournalAction("");
    setJournalCravingPeak("");
    setJournalCravingDuration("");
    // If datetime is enabled, default to now for the next entry.
    if (journalAdvancedOpen) {
      setJournalTsLocal(toDatetimeLocalValue(new Date()));
    } else {
      setJournalTsLocal("");
    }

  }

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
                  <div className={styles.titleRow}>
                    <div className={styles.title}>Gaarsdal Chat</div>
                    <span
                      className={`${styles.headerHeart} ${loading ? styles.headerHeartActive : ""}`}
                      aria-label={loading ? "Arbejder" : ""}
                      title={loading ? "Arbejder…" : ""}
                    >
                      ♥
                    </span>
                  </div>
                  <div className={styles.node}>{activeNodeLabel}</div>
                </div>

                <div className={styles.headerRight}>
                  <button
                    className={styles.iconBtn}
                    onClick={toggleExpanded}
                    title={expanded ? "Minimer" : "Maksimer"}
                    aria-label={expanded ? "Minimer" : "Maksimer"}
                  >
                    {expanded ? (
                      <ArrowsPointingInIcon className={styles.icon} />
                    ) : (
                      <ArrowsPointingOutIcon className={styles.icon} />
                    )}
                  </button>

                  <button className={styles.iconBtn} onClick={closeChat} title="Luk" aria-label="Luk">
                    <XMarkIcon className={styles.icon} />
                  </button>
                </div>
              </div>

              <div className={styles.actionsRow} aria-label="Tråde og handlinger">
                <button
                  className={styles.threadBtn}
                  onClick={() => setThreadsOpen(true)}
                  disabled={loading || !state}
                  title="Tråde"
                  aria-label="Tråde"
                >
                  <ChatBubbleOvalLeftEllipsisIcon className={styles.threadBtnIcon} />
                  <span className={styles.threadBtnLabel}>Tråde</span>
                </button>

                <div className={styles.actionsRight}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => dispatch({ type: "THREAD_CREATE", mode: "normal" } as any, { silentUser: true })}
                    disabled={loading}
                    title="Ny tråd"
                    aria-label="Ny tråd"
                  >
                    <PlusIcon className={styles.actionBtnIcon} />
                    <span className={styles.actionBtnLabel}>Ny</span>
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => openJournalWizard()}
                    disabled={loading}
                    title="Ny dagbog"
                    aria-label="Ny dagbog"
                  >
                    <PlusIcon className={styles.actionBtnIcon} />
                    <span className={styles.actionBtnLabel}>Dagbog</span>
                  </button>
                </div>
              </div>

              {journalWizardOpen && (
                <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={closeJournalWizard}>
                  <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                      <div className={styles.modalTitle}>Start dagbog</div>
                      <button className={styles.iconBtn} onClick={closeJournalWizard} title="Luk" aria-label="Luk">
                        <XMarkIcon className={styles.icon} />
                      </button>
                    </div>

                    {!canCreateJournal() ? (
                      <div className={styles.modalBody}>
                        <div className={styles.modalText}>Du har allerede 5 aktive dagbøger.</div>
                        <div className={styles.modalActions}>
                          <button className={styles.primaryBtn} onClick={closeJournalWizard}>
                            Ok
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.modalBody}>
                        {journalWizardStep === 1 && (
                          <>
                            <div className={styles.modalText}>Vælg type</div>
                            <div className={styles.optionGrid}>
                              <button
                                className={styles.optionBtn}
                                onClick={() => {
                                  setJournalWizardProfile("alcohol")
                                  setJournalWizardStep(2)
                                }}
                              >
                                <div className={styles.optionTitle}>Alkohol</div>
                                <div className={styles.optionHint}>Fritekst + drinks + urge.</div>
                              </button>
                              <button
                                className={styles.optionBtn}
                                onClick={() => {
                                  setJournalWizardProfile("general")
                                  setJournalWizardStep(2)
                                }}
                              >
                                <div className={styles.optionTitle}>Generel</div>
                                <div className={styles.optionHint}>Kun fritekst.</div>
                              </button>
                              <button
                                className={styles.optionBtn}
                                onClick={() => {
                                  setJournalWizardProfile("strict")
                                  setJournalWizardStep(2)
                                }}
                              >
                                <div className={styles.optionTitle}>Streng</div>
                                <div className={styles.optionHint}>Fritekst + én skala.</div>
                              </button>
                            </div>
                          </>
                        )}

                        {journalWizardStep === 2 && (
                          <>
                            <div className={styles.modalText}>Giv dagbogen en titel (emne)</div>
                            <input
                              className={styles.modalInput}
                              value={journalWizardTitle}
                              onChange={(e) => setJournalWizardTitle(e.target.value)}
                              placeholder="Fx: Alkohol – efter arbejde"
                            />
                            <div className={styles.modalActions}>
                              <button className={styles.secondaryBtn} onClick={() => setJournalWizardStep(1)}>
                                Tilbage
                              </button>
                              <button
                                className={styles.primaryBtn}
                                disabled={!journalWizardTitle.trim() || !journalWizardProfile}
                                onClick={() => setJournalWizardStep(3)}
                              >
                                Næste
                              </button>
                            </div>
                          </>
                        )}

                        {journalWizardStep === 3 && (
                          <>
                            <div className={styles.modalText}>Startdefinition</div>
                            <label className={styles.modalField}>
                              <span className={styles.modalLabel}>Problem / kontekst</span>
                              <textarea
                                className={styles.modalTextarea}
                                value={journalWizardProblem}
                                onChange={(e) => setJournalWizardProblem(e.target.value)}
                                rows={3}
                                placeholder="1–3 linjer"
                              />
                            </label>
                            <label className={styles.modalField}>
                              <span className={styles.modalLabel}>Mål / intention</span>
                              <textarea
                                className={styles.modalTextarea}
                                value={journalWizardGoal}
                                onChange={(e) => setJournalWizardGoal(e.target.value)}
                                rows={2}
                                placeholder="1–2 linjer"
                              />
                            </label>
                            <div className={styles.modalActions}>
                              <button className={styles.secondaryBtn} onClick={() => setJournalWizardStep(2)}>
                                Tilbage
                              </button>
                              <button
                                className={styles.primaryBtn}
                                disabled={!journalWizardProfile || !journalWizardTitle.trim()}
                                onClick={async () => {
                                  const profile = journalWizardProfile
                                  if (!profile) return
                                  const ok = await dispatch(
                                    {
                                      type: "THREAD_CREATE",
                                      mode: "normal",
                                      thread_type: "journal",
                                      journal_profile: profile,
                                      journal_init: {
                                        title: journalWizardTitle.trim(),
                                        problem: journalWizardProblem.trim(),
                                        goal: journalWizardGoal.trim(),
                                      },
                                    } as any,
                                    { silentUser: true }
                                  )
                                  if (ok) closeJournalWizard()
                                }}
                              >
                                Opret dagbog
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {threadsOpen && (
                <div
                  className={styles.threadsOverlay}
                  onClick={() => {
                    setThreadsOpen(false)
                    focusInput()
                  }}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className={styles.threadsHeader} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.threadsTitle}>Tråde</div>
                    <button
                      className={styles.iconBtn}
                      onClick={() => {
                        setThreadsOpen(false)
                        focusInput()
                      }}
                      title="Luk"
                      aria-label="Luk"
                    >
                      <XMarkIcon className={styles.icon} />
                    </button>
                  </div>

                  <div className={styles.threadsBody} onClick={(e) => e.stopPropagation()}>
                    {threadTabs.length === 0 ? (
                      <div className={styles.threadsHint}>Ingen tråde endnu.</div>
                    ) : (
                      <div className={styles.threadsList}>
                        {threadTabs
                          .slice()
                          .sort((a, b) => {
                            const ta = Date.parse(a.updated_at || "") || 0
                            const tb = Date.parse(b.updated_at || "") || 0
                            return tb - ta
                          })
                          .map((t) => {
                            const isActive = !!activeConversationId && t.conversation_id === activeConversationId
                            const label = (t.title || "").trim() || trimDuplicateTitle(t.preview || "Samtale")
                            const isJournal = t.thread_type === "journal"
                            return (
                              <button
                                key={t.conversation_id}
                                className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ""}`}
                                onClick={() => {
                                  if (!isActive)
                                    dispatch({ type: "THREAD_SWITCH", conversation_id: t.conversation_id } as any, {
                                      silentUser: true,
                                    })
                                  setThreadsOpen(false)
                                  focusInput()
                                }}
                                disabled={loading || !state}
                                title={t.preview || t.title || ""}
                              >
                                <div className={styles.threadItemTop}>
                                  <div className={styles.threadItemTitle}>{label}</div>
                                  {isJournal ? <span className={styles.threadBadge}>Dagbog</span> : null}
                                </div>
                                {t.preview ? <div className={styles.threadItemPreview}>{formatThreadPreview(t)}</div> : null}
                              </button>
                            )
                          })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {headerNavHint && (
                <div className={styles.navHint}>
                  <span className={styles.navHintPulse}>{headerNavHint}</span>
                </div>
              )}
            </div>

            <div className={styles.messages}>
              {!isJournalActive &&
                visibleMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}
                  >
                    {m.text}
                  </div>
                ))}

              {isJournalActive && (
                <div className={styles.journalWrap}>
                  {journalEntries.length === 0 ? (
                    <div className={styles.journalEmpty}>
                      <div className={styles.journalEmptyTitle}>{journalTitle ? `Dagbog – ${journalTitle}` : "Dagbog"}</div>
                      <div className={styles.journalEmptyText}>
                        {journalProfile === "alcohol"
                          ? "Skriv et kort notat og evt. drinks + urge (0–10)."
                          : journalProfile === "strict"
                          ? "Skriv et kort notat og en skala (0–10)."
                          : "Skriv et kort notat."}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.journalList}>
                      {journalEntries
                        .slice()
                        .sort((a, b) => (a.ts_ms ?? 0) - (b.ts_ms ?? 0))
                        .map((e) => {
                          const dt = new Date(e.ts_ms)
                          const time = Number.isFinite(e.ts_ms) ? dt.toLocaleString() : ""
                          const drinks = e.fields?.drinks
                          const urge = e.fields?.urge_0_10
                          const strict = e.fields?.strict_0_10
                          const moodTag = e.fields?.mood_tag
                          const mood = e.fields?.mood_0_10
                          const triggerTag = e.fields?.trigger_tag
                          const contextTag = e.fields?.context_tag
                          const copingTag = e.fields?.coping_tag
                          const action = e.fields?.action
                          const cravingPeak = e.fields?.craving_peak_0_10
                          const cravingDur = e.fields?.craving_duration_min
                          return (
                            <div key={e.entry_id} className={styles.journalEntry}>
                              <div className={styles.journalEntryTop}>
                                <div className={styles.journalEntryTime}>{time}</div>
                                <div className={styles.journalEntryChips}>
                                  {typeof drinks === "number" ? (
                                    <span className={styles.journalChip}>Drinks: {drinks}</span>
                                  ) : null}
                                  {typeof urge === "number" ? (
                                    <span className={styles.journalChip}>Urge: {urge}/10</span>
                                  ) : null}
                                  {typeof moodTag === "string" && moodTag.trim() ? (
                                    <span className={styles.journalChip}>Sind: {moodTag}</span>
                                  ) : null}
                                  {typeof mood === "number" ? (
                                    <span className={styles.journalChip}>Sind: {mood}/10</span>
                                  ) : null}
                                  {typeof triggerTag === "string" && triggerTag.trim() ? (
                                    <span className={styles.journalChip}>Trigger: {triggerTag}</span>
                                  ) : null}
                                  {typeof contextTag === "string" && contextTag.trim() ? (
                                    <span className={styles.journalChip}>Kontekst: {contextTag}</span>
                                  ) : null}
                                  {typeof copingTag === "string" && copingTag.trim() ? (
                                    <span className={styles.journalChip}>Coping: {copingTag}</span>
                                  ) : null}
                                  {typeof action === "string" && action.trim() ? (
                                    <span className={styles.journalChip}>Handling: {action}</span>
                                  ) : null}
                                  {typeof cravingPeak === "number" ? (
                                    <span className={styles.journalChip}>Craving: {cravingPeak}/10</span>
                                  ) : null}
                                  {typeof cravingDur === "number" ? (
                                    <span className={styles.journalChip}>Varighed: {cravingDur}m</span>
                                  ) : null}
                                  {typeof strict === "number" ? (
                                    <span className={styles.journalChip}>Skala: {strict}/10</span>
                                  ) : null}
                                </div>
                              </div>
                              {e.text ? <div className={styles.journalEntryText}>{e.text}</div> : null}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}

              {state?.status === "completed" && (
                <div className={styles.callout}>
                  <div className={styles.calloutTitle}>Næste</div>
                  <div className={styles.calloutRow}>
                    <button
                      className={styles.chipAction}
                      onClick={() => dispatch({ type: "FREE_TEXT", text: "new" }, { silentUser: true })}
                      disabled={loading || !state}
                    >
                      Ny tråd
                    </button>
                  </div>
                </div>
              )}

              {uiSuggestions.length > 0 && (
                <div className="mt-3">
                  <div className={styles.sectionTitle}>Forslag</div>
                  <div className={styles.calloutRow}>
                    {uiSuggestions.map((s) => (
                      <button
                        key={s.id}
                        className={styles.chipAction}
                        onClick={() => {
                          const input = s.input as any
                          if (input && input.type === "OPEN_URL" && typeof input.url === "string") {
                            router.push(input.url)
                            return
                          }

                          if (input) {
                            dispatch(input as InputSignal, { silentUser: true })
                          } else {
                            dispatch({ type: "FREE_TEXT", text: s.label })
                          }
                        }}
                        disabled={loading || !state || !freeTextEnabled}
                        title={s.label}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scroll anchor at the very bottom (includes waiting indicator + any callouts). */}
              <div ref={endRef} />
            </div>

            <div className={`${styles.footer} ${isJournalActive && journalAdvancedOpen ? styles.footerJournal : ""}`.trim()}>
              {!isJournalActive ? (
                <div className={styles.inputRow}>
                  <textarea
                    ref={textareaRef}
                    className={styles.textarea}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    disabled={!state || !freeTextEnabled}
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
                    title="Send"
                    aria-label="Send"
                    disabled={!state || !freeTextEnabled || loading || !input.trim()}
                  >
                    <PaperAirplaneIcon className={styles.sendBtnIcon} />
                  </button>
                </div>
              ) : (
                <div className={styles.journalInputWrap}>
                  {journalProfile === "alcohol" ? (
                    <div className={styles.journalInputRowTop}>
                      <label className={styles.journalField}>
                        <span className={styles.journalFieldLabel}>Drinks</span>
                        <input
                          className={styles.journalFieldInput}
                          inputMode="numeric"
                          value={journalDrinks}
                          onChange={(e) => setJournalDrinks(e.target.value)}
                          placeholder="0"
                          disabled={!state || !freeTextEnabled}
                        />
                      </label>
                      <label className={styles.journalField}>
                        <span className={styles.journalFieldLabel}>Urge (0–10)</span>
                        <input
                          className={styles.journalFieldInput}
                          inputMode="numeric"
                          value={journalUrge}
                          onChange={(e) => setJournalUrge(e.target.value)}
                          placeholder=""
                          disabled={!state || !freeTextEnabled}
                        />
                      </label>
                    </div>
                  ) : null}

                  {journalProfile === "alcohol" ? (
                    <div className={styles.journalMetaRow}>
                      <button
                        className={styles.journalToggleBtn}
                        type="button"
                        onClick={() => setJournalAdvancedOpen((v) => {
                          const next = !v;
                          if (next && !journalTsLocal) {
                            setJournalTsLocal(toDatetimeLocalValue(new Date()));;
                          }
                          return next;
                        })}
                        disabled={!state || !freeTextEnabled}
                      >
                        {journalAdvancedOpen ? "Skjul felter" : "Flere felter"}
                      </button>
                      {journalAdvancedOpen ? (
                        <div className={styles.journalMetaInline}>
                          <label className={styles.journalMetaField}>
                            <span className={styles.journalMetaLabel}>Dato/tid</span>
                            <input
                              className={styles.journalMetaInput}
                              type="datetime-local"
                              value={journalTsLocal}
                              onChange={(e) => setJournalTsLocal(e.target.value)}
                              disabled={!state || !freeTextEnabled}
                            />
                          </label>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {journalProfile === "alcohol" ? (
                    <>
                      {journalAdvancedOpen ? (
                        <div className={styles.journalExtrasScroll}>
                          <div className={styles.journalQuickBlock}>
                            <div className={styles.journalQuickGroup}>
                              <div className={styles.journalQuickLabel}>Sindstilstand</div>
                              <div className={styles.journalQuickRow}>
                                {["rolig", "stresset", "trist", "rastløs", "glad"].map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`${styles.journalQuickChip} ${journalMoodTag === v ? styles.journalQuickChipActive : ""}`}
                                    onClick={() => setJournalMoodTag((cur) => (cur === v ? "" : v))}
                                    disabled={!state || !freeTextEnabled}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className={styles.journalQuickGroup}>
                              <div className={styles.journalQuickLabel}>Trigger</div>
                              <div className={styles.journalQuickRow}>
                                {["stress", "socialt", "konflikt", "kedsomhed", "belønning"].map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`${styles.journalQuickChip} ${journalTriggerTag === v ? styles.journalQuickChipActive : ""}`}
                                    onClick={() => setJournalTriggerTag((cur) => (cur === v ? "" : v))}
                                    disabled={!state || !freeTextEnabled}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className={styles.journalQuickGroup}>
                              <div className={styles.journalQuickLabel}>Kontekst</div>
                              <div className={styles.journalQuickRow}>
                                {["alene", "sammen", "hjemme", "ude", "aften"].map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`${styles.journalQuickChip} ${journalContextTag === v ? styles.journalQuickChipActive : ""}`}
                                    onClick={() => setJournalContextTag((cur) => (cur === v ? "" : v))}
                                    disabled={!state || !freeTextEnabled}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className={styles.journalQuickGroup}>
                              <div className={styles.journalQuickLabel}>Coping</div>
                              <div className={styles.journalQuickRow}>
                                {["gåtur", "vand", "vejrtrækning", "ring", "distraktion"].map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`${styles.journalQuickChip} ${journalCopingTag === v ? styles.journalQuickChipActive : ""}`}
                                    onClick={() => setJournalCopingTag((cur) => (cur === v ? "" : v))}
                                    disabled={!state || !freeTextEnabled}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className={styles.journalQuickGroup}>
                              <div className={styles.journalQuickLabel}>Handling</div>
                              <div className={styles.journalQuickRow}>
                                {["drak", "undlod", "skar ned"].map((v) => (
                                  <button
                                    key={v}
                                    type="button"
                                    className={`${styles.journalQuickChip} ${journalAction === v ? styles.journalQuickChipActive : ""}`}
                                    onClick={() => setJournalAction((cur) => (cur === v ? "" : v))}
                                    disabled={!state || !freeTextEnabled}
                                  >
                                    {v}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className={styles.journalAdvancedGrid}>
                              <label className={styles.journalField}>
                                <span className={styles.journalFieldLabel}>Sind (0–10)</span>
                                <input
                                  className={styles.journalFieldInput}
                                  inputMode="numeric"
                                  value={journalMood}
                                  onChange={(e) => setJournalMood(e.target.value)}
                                  placeholder=""
                                  disabled={!state || !freeTextEnabled}
                                />
                              </label>
                              <label className={styles.journalField}>
                                <span className={styles.journalFieldLabel}>Craving peak (0–10)</span>
                                <input
                                  className={styles.journalFieldInput}
                                  inputMode="numeric"
                                  value={journalCravingPeak}
                                  onChange={(e) => setJournalCravingPeak(e.target.value)}
                                  placeholder=""
                                  disabled={!state || !freeTextEnabled}
                                />
                              </label>
                              <label className={styles.journalField}>
                                <span className={styles.journalFieldLabel}>Craving varighed (min)</span>
                                <input
                                  className={styles.journalFieldInput}
                                  inputMode="numeric"
                                  value={journalCravingDuration}
                                  onChange={(e) => setJournalCravingDuration(e.target.value)}
                                  placeholder=""
                                  disabled={!state || !freeTextEnabled}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.journalTagSummary}>
                          {(() => {
                            const chips = [
                              journalMoodTag ? `Sind: ${journalMoodTag}` : "",
                              journalTriggerTag ? `Trigger: ${journalTriggerTag}` : "",
                              journalContextTag ? `Kontekst: ${journalContextTag}` : "",
                              journalCopingTag ? `Coping: ${journalCopingTag}` : "",
                              journalAction ? `Handling: ${journalAction}` : "",
                            ].filter(Boolean)

                            if (!chips.length) return null
                            return (
                              <div className={styles.journalTagSummaryRow}>
                                {chips.map((c) => (
                                  <span key={c} className={styles.journalTagPill}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </>
                  ) : null}

                  {journalProfile === "strict" ? (
                    <div className={styles.journalInputRowTop}>
                      <label className={styles.journalField}>
                        <span className={styles.journalFieldLabel}>Skala (0–10)</span>
                        <input
                          className={styles.journalFieldInput}
                          inputMode="numeric"
                          value={journalStrict}
                          onChange={(e) => setJournalStrict(e.target.value)}
                          placeholder=""
                          disabled={!state || !freeTextEnabled}
                        />
                      </label>
                    </div>
                  ) : null}

                  <div className={styles.inputRow}>
                    <textarea
                      ref={textareaRef}
                      className={styles.textarea}
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder={placeholder}
                      rows={2}
                      disabled={!state || !freeTextEnabled}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          submitJournalEntry()
                        }
                      }}
                    />
                    <button
                      className={styles.sendBtn}
                      onClick={() => {
                        submitJournalEntry()
                      }}
                      title="Gem"
                      aria-label="Gem"
                      disabled={!state || !freeTextEnabled || loading}
                    >
                      <PaperAirplaneIcon className={styles.sendBtnIcon} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
