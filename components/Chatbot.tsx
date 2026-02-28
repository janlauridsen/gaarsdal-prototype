"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PlusIcon,
  ArchiveBoxIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline"

import styles from "./Chatbot.module.css"

// UI text lives in the node registry to keep runtime + UI consistent.
import getNode from "../chat/nodes/registry"

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
  | { type: "THREAD_CREATE"; mode: "normal" }
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


type ThreadTab = { conversation_id: string; title: string; preview: string; status: "active" | "archived"; updated_at?: string }

const NODE_LABELS: Record<string, string> = {
  THREAD_CHOOSER: "Tråde",
  HOME: "Forside",
  GEN_HYPNO: "Dialog med assistenten",
  TRIAGE: "Passer hypnoterapi til min situation?",
  METHOD_FIT: "Hypnoterapi eller et bedre alternativ?",
  REFLECTION: "Refleksion",
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

export default function Chatbot() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const [state, setState] = useState<ConversationState | null>(null)
  // Messages are cached per conversation id (tabs).
  const [messagesByConversationId, setMessagesByConversationId] = useState<Record<string, ChatMessage[]>>({})
  const loadedConversationsRef = useRef<Set<string>>(new Set())
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Threads overlay (drawer) lives on top of the chat view.

  // Secondary (overflow) menu in the footer toolbar.
  const [secondaryMenuOpen, setSecondaryMenuOpen] = useState(false)
  const secondaryMenuRef = useRef<HTMLDivElement | null>(null)

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const didAutoStartNewThreadRef = useRef(false)

  // Global footer actions must always be reachable, regardless of the current node's allowed_transitions.
  // (Kernel also whitelists these exits.)
  const GLOBAL_ACTIONS = useMemo(() => new Set(["HOME", "TLF", "MAIL", "CONTACT_FORM", "AKUT"]), [])

  function metaValue(key: string) {
    const entry = state?.meta?.[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const activeNodeLabel = useMemo(() => {
    if (!state) return "Initialiserer…"
    const key = String(state.active_node ?? "").trim()
    // Prefer node registry subtitle/goal over internal ids.
    try {
      const node = getNode(key)
      return node.ui_subtitle ?? node.goal ?? NODE_LABELS[key] ?? key
    } catch {
      return NODE_LABELS[key] ?? key
    }
  }, [state])

  const threadTabs: ThreadTab[] = useMemo(() => {
    const raw = metaValue("threads.tabs")
    return Array.isArray(raw) ? (raw as any) : []
  }, [state?.meta])

  const activeConversationId = state?.conversation_id ?? null

  const visibleMessages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversationId[activeConversationId] ?? []
  }, [activeConversationId, messagesByConversationId])

  const activeNodeHint = useMemo(() => {
    if (!state) return null
    const key = String(state.active_node ?? "").trim()
    try {
      const node = getNode(key)
      const hint = (node.ui_hint ?? "").trim()
      return hint || null
    } catch {
      return null
    }
  }, [state])


  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    try {
      const node = getNode(String(state.active_node ?? "").trim())
      return node.ui_placeholder ?? "Skriv din besked…"
    } catch {
      return "Skriv din besked…"
    }
  }, [state])

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    if (loading) return false
    if (state.status === "completed" || state.status === "rejected") return false
    return true
  }, [state, loading])

  useEffect(() => {
    if (!open) return
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [visibleMessages, open, headerNavHint, expanded])

  // (Loading indicator is shown in header as a blinking heart.)

  useEffect(() => {
    return () => {
      if (headerNavHintTimerRef.current) {
        window.clearTimeout(headerNavHintTimerRef.current)
        headerNavHintTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!secondaryMenuOpen) return
    const onDocPointerDown = (e: MouseEvent) => {
      const el = secondaryMenuRef.current
      if (!el) return
      if (el.contains(e.target as Node)) return
      setSecondaryMenuOpen(false)
    }
    document.addEventListener("mousedown", onDocPointerDown)
    return () => document.removeEventListener("mousedown", onDocPointerDown)
  }, [secondaryMenuOpen])

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

  async function dispatch(nextInput: InputSignal, opts?: { silentUser?: boolean }) {
    if (!state) return
    setLoading(true)

    try {
      const fromNode = state.active_node
      const data = await callKernel(state, nextInput)

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
        if (state.conversation_id) appendUserMessage(state.conversation_id, nextInput.text)
      }

      setState(data.state)

      const assistantText =
        (data.transition?.response_message as string | undefined) ?? normalizeAssistantMessage(data.state)

      if (isThreadNav) {
        setInput("")
        setHeaderNavHint(null)
        await ensureConversationLoaded(data.state.conversation_id, data.state)
      } else {
        if (state.conversation_id) appendAssistantMessage(state.conversation_id, assistantText)
      }
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
    setSecondaryMenuOpen(false)
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

              <div className={styles.tabBarWrap} aria-label="Tråde">
                <div className={styles.tabBar} role="tablist">
                  {threadTabs.map((tab) => {
                    const isActive = !!activeConversationId && tab.conversation_id === activeConversationId
                    const label = (tab.title || "").trim() || trimDuplicateTitle(tab.preview || "Samtale")
                    return (
                      <button
                        key={tab.conversation_id}
                        role="tab"
                        aria-selected={isActive}
                        className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                        onClick={() => dispatch({ type: "THREAD_SWITCH", conversation_id: tab.conversation_id } as any, { silentUser: true })}
                        disabled={loading || !state || isActive}
                        title={tab.preview || tab.title || ""}
                      >
                        <span className={styles.tabLabel}>{label}</span>
                      </button>
                    )
                  })}
                </div>

                <button
                  className={`${styles.tab} ${styles.tabPlusFixed}`}
                  onClick={() => dispatch({ type: "THREAD_CREATE", mode: "normal" } as any, { silentUser: true })}
                  disabled={loading}
                  title="Ny tråd"
                  aria-label="Ny tråd"
                >
                  <PlusIcon className={styles.tabIcon} />
                  <span className={styles.tabPlusLabel}>Ny</span>
                </button>
              </div>


              {headerNavHint && (
                <div className={styles.navHint}>
                  <span className={styles.navHintPulse}>{headerNavHint}</span>
                </div>
              )}
            </div>

	            <div className={styles.messages}>

              {/* Calm, non-bubble hint shown only when there is no transcript yet */}
              {visibleMessages.length === 0 && state && (
                <div className={styles.hint}>
                  {activeNodeHint ?? normalizeAssistantMessage(state)}
                </div>
              )}

              {visibleMessages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}
                >
                  {m.text}
                </div>
              ))}

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

            <div className={styles.footer}>
              <div className={styles.inputRow}>
  <div className={styles.footerMenuInline} ref={secondaryMenuRef}>
    <button
      className={styles.footerIcon}
      onClick={() => setSecondaryMenuOpen((v) => !v)}
      title="Mere"
      aria-label="Mere"
      disabled={loading}
      type="button"
    >
      <EllipsisVerticalIcon className={styles.footerIconSvg} />
    </button>

    {secondaryMenuOpen && (
      <div className={styles.footerMenuPanel} role="menu" aria-label="Mere handlinger">
        <button
          className={styles.footerMenuItem}
          onClick={() => {
            setSecondaryMenuOpen(false)
            dispatch({ type: "UI_ACTION", action: "MAIL" } as any)
          }}
          type="button"
        >
          <EnvelopeIcon className={styles.footerMenuItemIcon} />
          <span className={styles.footerMenuItemLabel}>E-mail</span>
        </button>
        <button
          className={styles.footerMenuItem}
          onClick={() => {
            setSecondaryMenuOpen(false)
            dispatch({ type: "UI_ACTION", action: "TLF" } as any)
          }}
          type="button"
        >
          <PhoneIcon className={styles.footerMenuItemIcon} />
          <span className={styles.footerMenuItemLabel}>Telefon</span>
        </button>
        <button
          className={styles.footerMenuItem}
          onClick={() => {
            setSecondaryMenuOpen(false)
            dispatch({ type: "UI_ACTION", action: "CONTACT_FORM" } as any)
          }}
          type="button"
        >
          <LinkIcon className={styles.footerMenuItemIcon} />
          <span className={styles.footerMenuItemLabel}>Kontakt</span>
        </button>
      </div>
    )}
  </div>

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
            </div>
          </div>
        </>
      )}
    </>
  )
}
