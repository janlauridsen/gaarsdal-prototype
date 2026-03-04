"use client"

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import type React from "react"
import { useRouter } from "next/router"
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline"

import styles from "./Chatbot.module.css"

import { NODE_LABELS } from "./chatbot/constants"
import { safeId, splitThreadLabel, trimDuplicateTitle } from "./chatbot/utils"
import type {
  ChatMessage,
  ConversationState,
  InputSignal,
  JournalEntry,
  KernelResponse,
  ThreadChoice,
  ThreadTab,
  UiSuggestion,
} from "./chatbot/types"

import ChatComposer from "./chatbot/ChatComposer"
import { ChatHeader } from "./chatbot/ChatHeader"
import { MessagePane } from "./chatbot/MessagePane"
import { JournalComposer } from "./chatbot/journal/JournalComposer"

export default function Chatbot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [threadsOpen, setThreadsOpen] = useState(false)

  const [journalWizardOpen, setJournalWizardOpen] = useState(false)
  const [journalWizardStep, setJournalWizardStep] = useState<1 | 2>(1)
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
  const [journalDetailsOpen, setJournalDetailsOpen] = useState(false)
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

  // Draft evaluation (coaching) before save
  const [journalEvalModalOpen, setJournalEvalModalOpen] = useState(false)
  const [journalEvalLoading, setJournalEvalLoading] = useState(false)
  const [journalEvalError, setJournalEvalError] = useState<string | null>(null)
  const [journalEvalQuestions, setJournalEvalQuestions] = useState<string[]>([])
  const [journalEvalSummary, setJournalEvalSummary] = useState<string>("")
  const [journalEvalLastHash, setJournalEvalLastHash] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Threads overlay (drawer) lives on top of the chat view.

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const didAutoStartNewThreadRef = useRef(false)

  const focusInput = () => {
    // defer to after DOM commit
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
    })
  }

  // Bottom sheet accessibility: ESC closes, TAB is trapped inside while open.
  const onSheetKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      setJournalDetailsOpen(false)
      focusInput()
      return
    }

    if (e.key !== "Tab") return
    const root = sheetRef.current
    if (!root) return

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"))

    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey) {
      if (!active || active === first || !root.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (!active || active === last || !root.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
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

  function resetJournalWizardDraft() {
    setJournalWizardProfile(null)
    setJournalWizardTitle("")
    setJournalWizardProblem("")
    setJournalWizardGoal("")
    setJournalWizardStep(1)
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
    if (journalDetailsOpen) return
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
    journalDetailsOpen,
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
  // (No persisted UI prefs for the journal yet.)

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

  function stableHash(input: any): string {
    try {
      return JSON.stringify(input)
    } catch {
      return String(input ?? "")
    }
  }

  async function evaluateJournalDraft() {
    if (!state) return
    if (journalProfile !== "alcohol" && journalProfile !== "general" && journalProfile !== "strict") return

    const text = journalText.trim()
    const drinks = Number.parseInt(journalDrinks.trim(), 10)
    const urge = Number.parseInt(journalUrge.trim(), 10)
    const strict = Number.parseInt(journalStrict.trim(), 10)

    const mood0 = Number.parseInt(journalMood.trim(), 10)
    const cravingPeak = Number.parseInt(journalCravingPeak.trim(), 10)
    const cravingDur = Number.parseInt(journalCravingDuration.trim(), 10)

    const ts_ms = journalTsLocal.trim() ? new Date(journalTsLocal.trim()).getTime() : undefined

    const payloadObj = {
      profile: journalProfile,
      draft: {
        text,
        ts_ms: typeof ts_ms === "number" && Number.isFinite(ts_ms) ? ts_ms : undefined,
        fields: {
          drinks: journalProfile === "alcohol" && Number.isFinite(drinks) ? drinks : undefined,
          urge_0_10: journalProfile === "alcohol" && Number.isFinite(urge) ? urge : undefined,
          strict_0_10: journalProfile === "strict" && Number.isFinite(strict) ? strict : undefined,
          mood_tag: journalProfile === "alcohol" ? (journalMoodTag.trim() || undefined) : undefined,
          mood_0_10: journalProfile === "alcohol" && Number.isFinite(mood0) ? mood0 : undefined,
          trigger_tag: journalProfile === "alcohol" ? (journalTriggerTag.trim() || undefined) : undefined,
          context_tag: journalProfile === "alcohol" ? (journalContextTag.trim() || undefined) : undefined,
          coping_tag: journalProfile === "alcohol" ? (journalCopingTag.trim() || undefined) : undefined,
          action: journalProfile === "alcohol" ? (journalAction.trim() || undefined) : undefined,
          craving_peak_0_10: journalProfile === "alcohol" && Number.isFinite(cravingPeak) ? cravingPeak : undefined,
          craving_duration_min: journalProfile === "alcohol" && Number.isFinite(cravingDur) ? cravingDur : undefined,
        },
      },
    }

    const hash = stableHash(payloadObj)
    if (hash === journalEvalLastHash && journalEvalQuestions.length) {
      setJournalEvalModalOpen(true)
      return
    }

    setJournalEvalLoading(true)
    setJournalEvalError(null)
    setJournalEvalQuestions([])
    setJournalEvalSummary("")

    try {
      const res = await fetch("/api/journal/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payloadObj),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}${txt ? ` — ${txt}` : ""}`)
      }
      const data = (await res.json().catch(() => null)) as any
      const qs = Array.isArray(data?.questions) ? data.questions.map((x: any) => String(x)).filter(Boolean) : []
      const summary = typeof data?.summary === "string" ? data.summary.trim() : ""
      setJournalEvalQuestions(qs.slice(0, 6))
      setJournalEvalSummary(summary)
      setJournalEvalLastHash(hash)
      setJournalEvalModalOpen(true)
    } catch (e: any) {
      setJournalEvalError(e?.message ? String(e.message) : "Kunne ikke evaluere input")
      setJournalEvalModalOpen(true)
    } finally {
      setJournalEvalLoading(false)
    }
  }

  const submitJournalEntry = async (opts?: { bypassEval?: boolean }) => {
    if (!state || !freeTextEnabled || loading) return

    // Optional coaching step before save.
    if (!opts?.bypassEval && journalProfile === "alcohol") {
      await evaluateJournalDraft()
      return
    }

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
    setJournalMood("");
    setJournalTriggerTag("");
    setJournalContextTag("");
    setJournalCopingTag("");
    setJournalAction("");
    setJournalCravingPeak("");
    setJournalCravingDuration("");
    // If datetime is enabled, default to now for the next entry.
    // Keep timestamp empty by default; user can add it via “Detaljer”.
    setJournalTsLocal("")

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
            <ChatHeader

              loading={loading}

              expanded={expanded}

              activeNodeLabel={activeNodeLabel}

              openJournalWizard={openJournalWizard}

              toggleExpanded={toggleExpanded}

              closeChat={closeChat}


              threadsOpen={threadsOpen}

              setThreadsOpen={setThreadsOpen}

              threadTabs={threadTabs}

              activeConversationId={activeConversationId}

              state={state}

              dispatch={dispatch}


              journalWizardOpen={journalWizardOpen}

              journalWizardStep={journalWizardStep}

              journalWizardProfile={journalWizardProfile ?? "general"}

              journalWizardTitle={journalWizardTitle}

              journalWizardProblem={journalWizardProblem}

              journalWizardGoal={journalWizardGoal}

              canCreateJournal={canCreateJournal()}

              setJournalWizardStep={setJournalWizardStep as any}

              setJournalWizardProfile={setJournalWizardProfile as any}

              setJournalWizardTitle={setJournalWizardTitle}

              setJournalWizardProblem={setJournalWizardProblem}

              setJournalWizardGoal={setJournalWizardGoal}

              closeJournalWizard={closeJournalWizard}

              resetJournalWizardDraft={resetJournalWizardDraft}


              journalEvalModalOpen={journalEvalModalOpen}

              journalEvalLoading={journalEvalLoading}

              journalEvalError={journalEvalError ?? ""}

              journalEvalSummary={journalEvalSummary}

              journalEvalQuestions={journalEvalQuestions}

              setJournalEvalModalOpen={setJournalEvalModalOpen}

              focusInput={focusInput}

              submitJournalEntry={submitJournalEntry}


              journalDetailsOpen={journalDetailsOpen}

              journalProfile={journalProfile}

              freeTextEnabled={freeTextEnabled}

              sheetRef={sheetRef}

              onSheetKeyDown={onSheetKeyDown}

              setJournalDetailsOpen={setJournalDetailsOpen}

              journalTsLocal={journalTsLocal}

              setJournalTsLocal={setJournalTsLocal}

              journalMoodTag={journalMoodTag}

              setJournalMoodTag={setJournalMoodTag}

              journalMood={journalMood}

              setJournalMood={setJournalMood}

              journalTriggerTag={journalTriggerTag}

              setJournalTriggerTag={setJournalTriggerTag}

              journalContextTag={journalContextTag}

              setJournalContextTag={setJournalContextTag}

              journalCopingTag={journalCopingTag}

              setJournalCopingTag={setJournalCopingTag}

              journalAction={journalAction}

              setJournalAction={setJournalAction}

              journalCravingPeak={journalCravingPeak}

              setJournalCravingPeak={setJournalCravingPeak}

              journalCravingDuration={journalCravingDuration}

              setJournalCravingDuration={setJournalCravingDuration}


              headerNavHint={headerNavHint}

            />


            <MessagePane
              isJournalActive={isJournalActive}
              visibleMessages={visibleMessages}
              journalEntries={journalEntries}
              journalTitle={journalTitle}
              journalProfile={journalProfile}
              state={state}
              loading={loading}
              freeTextEnabled={freeTextEnabled}
              uiSuggestions={uiSuggestions}
              dispatch={dispatch}
              endRef={endRef}
            />

            <div className={`${styles.footer} ${isJournalActive ? styles.footerJournal : ""}`.trim()}>
              {!isJournalActive ? (
                <ChatComposer
                  textareaRef={textareaRef}
                  value={input}
                  placeholder={placeholder}
                  disabled={!state || !freeTextEnabled}
                  loading={loading}
                  onChange={setInput}
                  onSend={(text) => {
                    setInput("")
                    dispatch({ type: "FREE_TEXT", text })
                  }}
                />
              ) : (
                <JournalComposer
                  textareaRef={textareaRef}
                  placeholder={placeholder}
                  disabled={!state || !freeTextEnabled}
                  loading={loading}
                  journalProfile={journalProfile}
                  journalText={journalText}
                  setJournalText={setJournalText}
                  submitJournalEntry={submitJournalEntry}
                  journalDrinks={journalDrinks}
                  setJournalDrinks={setJournalDrinks}
                  journalUrge={journalUrge}
                  setJournalUrge={setJournalUrge}
                  journalStrict={journalStrict}
                  setJournalStrict={setJournalStrict}
                  journalTsLocal={journalTsLocal}
                  setJournalTsLocal={setJournalTsLocal}
                  setJournalDetailsOpen={setJournalDetailsOpen}
                  evaluateJournalDraft={evaluateJournalDraft}
                  journalEvalLoading={journalEvalLoading}
                  journalMoodTag={journalMoodTag}
                  journalTriggerTag={journalTriggerTag}
                  journalContextTag={journalContextTag}
                  journalCopingTag={journalCopingTag}
                  journalAction={journalAction}
                />
              )
            </div>)()}
                        </div>
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
