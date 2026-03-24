"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline"

import styles from "./Chatbot.module.css"

import { NODE_LABELS } from "./chatbot/constants"
import { safeId } from "./chatbot/utils"
import type {
  AsyncConversationJob,
  AsyncDraft,
  ChatMessage,
  ConversationState,
  DeferredJobSignal,
  InputSignal,
  KernelResponse,
  NodeFormSpec,
  ThreadTab,
  UiSuggestion,
} from "./chatbot/types"

import ChatComposer from "./chatbot/ChatComposer"
import FormComposer from "./chatbot/FormComposer"
import { ChatHeader } from "./chatbot/ChatHeader"
import { MessagePane } from "./chatbot/MessagePane"
import { SessionClose } from "./chatbot/SessionClose"

type ThreadsIndexResponse = {
  active_conversation_id?: string | null
  threads?: Array<{
    conversation_id: string
    status?: string
    title?: string
    preview?: string
  }>
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [threadsOpen, setThreadsOpen] = useState(false)

  const [state, setState] = useState<ConversationState | null>(null)
  const [messagesByConversationId, setMessagesByConversationId] = useState<Record<string, ChatMessage[]>>({})
  const loadedConversationsRef = useRef<Set<string>>(new Set())
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [pendingJobs, setPendingJobs] = useState<AsyncConversationJob[]>([])
  const [jobRunnerState, setJobRunnerState] = useState<{
    jobId: string
    label: string
    progress: number
    status: string
    error: string | null
  } | null>(null)
  const [draftReview, setDraftReview] = useState<AsyncDraft | null>(null)
  const [draftSummaryInput, setDraftSummaryInput] = useState("")
  const [draftOpenQuestionsInput, setDraftOpenQuestionsInput] = useState("")
  const [draftSaving, setDraftSaving] = useState(false)
  const [nodeForm, setNodeForm] = useState<NodeFormSpec | null>(null)
  const [nodeAllowFreeText, setNodeAllowFreeText] = useState<boolean>(true)
  const [nodeAllowedExits, setNodeAllowedExits] = useState<string[]>([])

  const [headerNavHint, setHeaderNavHint] = useState<string | null>(null)
  const headerNavHintTimerRef = useRef<number | null>(null)

  // ─── Inaktivitets-timer til session-afslutning (Sprint 3) ─────────────────
  // Vises efter INACTIVITY_SECONDS sekunder uden bruger-input, forudsat at
  // der er mindst MIN_TURNS AI-svar i samtalen.
  const INACTIVITY_SECONDS = 60
  const MIN_TURNS_FOR_CLOSE = 2
  const [sessionCloseVisible, setSessionCloseVisible] = useState(false)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function resetInactivityTimer(currentState: typeof state) {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    setSessionCloseVisible(false)
    inactivityTimerRef.current = setTimeout(() => {
      const turnCount = currentState?.meta?.["gen_hypno.assistant_turn_count"]
      const count = turnCount && typeof turnCount === "object" && "value" in turnCount
        ? (turnCount as any).value
        : typeof turnCount === "number" ? turnCount : 0
      if (count >= MIN_TURNS_FOR_CLOSE) {
        setSessionCloseVisible(true)
      }
    }, INACTIVITY_SECONDS * 1000)
  }
  // ─────────────────────────────────────────────────────────────────────────

  const endRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [copyLinkLabel, setCopyLinkLabel] = useState("Kopiér link")
  const didAutoStartNewThreadRef = useRef(false)
  const jobLoopRef = useRef<{ conversationId: string; jobId: string; cancelled: boolean } | null>(null)
  const initInFlightRef = useRef(false)

  const scrollChatToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" })
  }

  const syncViewportHeight = () => {
    if (typeof window === "undefined") return

    const viewport = window.visualViewport
    const layoutHeight = window.innerHeight
    const viewportHeight = Math.round(viewport?.height ?? layoutHeight)
    const viewportOffsetTop = Math.max(0, Math.round(viewport?.offsetTop ?? 0))
    const viewportOffsetLeft = Math.max(0, Math.round(viewport?.offsetLeft ?? 0))
    const keyboardInset = Math.max(0, layoutHeight - viewportHeight - viewportOffsetTop)

    document.documentElement.style.setProperty("--app-dvh", `${layoutHeight}px`)
    document.documentElement.style.setProperty("--chatbot-viewport-height", `${viewportHeight}px`)
    document.documentElement.style.setProperty("--chatbot-viewport-offset-top", `${viewportOffsetTop}px`)
    document.documentElement.style.setProperty("--chatbot-viewport-offset-left", `${viewportOffsetLeft}px`)
    document.documentElement.style.setProperty("--chatbot-keyboard-inset", `${keyboardInset}px`)
  }

  const syncComposerMetrics = () => {
    if (typeof window === "undefined") return

    const footerHeight = Math.max(0, Math.ceil(footerRef.current?.getBoundingClientRect().height ?? 0))
    const nextHeight = footerHeight || 88
    document.documentElement.style.setProperty("--chatbot-composer-height", `${nextHeight}px`)
  }

  const isUnsupportedInAppBrowser = open && isMobileViewport && isInAppBrowser

  const openCurrentPageInBrowser = () => {
    if (typeof window === "undefined") return
    const url = window.location.href

    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer")
      if (opened) return
    } catch {
      // Ignore and fall back to location assignment.
    }

    window.location.href = url
  }

  const copyCurrentPageLink = async () => {
    if (typeof window === "undefined") return
    const url = window.location.href

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setCopyLinkLabel("Link kopieret")
        window.setTimeout(() => setCopyLinkLabel("Kopiér link"), 1800)
        return
      }
    } catch {
      // Ignore and fall through to best-effort prompt fallback.
    }

    try {
      window.prompt("Kopiér linket herfra", url)
    } catch {
      // Best effort only.
    }
  }

  const scheduleComposerIntoView = (delay = 280) => {
    window.setTimeout(() => {
      textareaRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
      scrollChatToBottom()
    }, delay)
  }

  const focusInput = () => {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus()
      scheduleComposerIntoView()
    })
  }

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

  const activeNodeLabel = useMemo(() => {
    if (!state) return "Initialiserer…"
    const key = String(state.active_node ?? "").trim()
    return NODE_LABELS[key] ?? key
  }, [state])

  const visibleMessages = useMemo(() => {
    if (!activeConversationId) return []
    return messagesByConversationId[activeConversationId] ?? []
  }, [activeConversationId, messagesByConversationId])

  const placeholder = useMemo(() => {
    if (!state) return "Initialiserer…"
    return "Skriv her…"
  }, [state])

  const freeTextEnabled = useMemo(() => {
    if (!state) return false
    if (loading) return false
    if (state.status === "completed" || state.status === "rejected") return false
    return true
  }, [state, loading])

  function delay(ms: number) {
    return new Promise((resolve) => window.setTimeout(resolve, ms))
  }

  function trimDraftText(value: string, max = 4000) {
    return value.replace(/\r\n?/g, "\n").trim().slice(0, max)
  }

  function parseOpenQuestions(value: string): string[] {
    const out: string[] = []
    const seen = new Set<string>()
    for (const raw of value.split(/\n+/g)) {
      const line = raw.trim()
      const key = line.toLowerCase()
      if (!line || seen.has(key)) continue
      seen.add(key)
      out.push(line)
      if (out.length >= 10) break
    }
    return out
  }

  function applyDraftToEditor(draft: AsyncDraft | null) {
    setDraftReview(draft)
    setDraftSummaryInput(draft?.accepted_summary ?? draft?.summary_draft ?? "")
    setDraftOpenQuestionsInput((draft?.open_questions ?? []).join("\n"))
  }

  function statusLabelForJob(job: { kind: string; cursor?: string; status?: string }) {
    if (job.kind === "scan_threads") {
      const cursor = String(job.cursor ?? "").toUpperCase()
      if (cursor === "SHORTLIST") return "Finder relevante tråde…"
      if (cursor === "SELECT") return "Vælger relevante tråde…"
      if (cursor === "DEEP_DIVE") return "Læser tidligere samtaler…"
      if (cursor === "BUILD_DRAFT") return "Skriver opsummering…"
      if (job.status === "queued") return "Afventer kørsel…"
      if (job.status === "completed") return "Opsummering klar"
      if (job.status === "failed") return "Opgaven fejlede"
    }
    return "Behandler baggrundsopgave…"
  }

  async function fetchPendingJobs(conversationId: string) {
    const res = await fetch(`/api/jobs/pending?conversationId=${encodeURIComponent(conversationId)}`, {
      credentials: "include",
    })
    if (!res.ok) {
      if (res.status === 404) {
        setPendingJobs([])
        return [] as AsyncConversationJob[]
      }
      throw new Error(`Jobs pending: HTTP ${res.status}`)
    }
    const data = (await res.json().catch(() => null)) as any
    const jobs = Array.isArray(data?.jobs) ? (data.jobs as AsyncConversationJob[]) : []
    setPendingJobs(jobs)
    return jobs
  }

  async function fetchLatestDraft(conversationId: string) {
    const res = await fetch(`/api/jobs/draft?conversationId=${encodeURIComponent(conversationId)}&latest=1`, {
      credentials: "include",
    })
    if (res.status === 404) {
      applyDraftToEditor(null)
      return null
    }
    if (!res.ok) throw new Error(`Jobs draft: HTTP ${res.status}`)
    const draft = (await res.json().catch(() => null)) as AsyncDraft | null
    if (!draft || draft.conversation_id !== conversationId || draft.accepted_at) {
      applyDraftToEditor(null)
      return null
    }
    applyDraftToEditor(draft)
    return draft
  }

  function upsertPendingJob(job: AsyncConversationJob) {
    setPendingJobs((prev) => {
      const next = prev.filter((item) => item.job_id !== job.job_id)
      next.push(job)
      next.sort((a, b) => (a.updated_at ?? 0) - (b.updated_at ?? 0))
      return next
    })
  }

  function removePendingJob(jobId: string) {
    setPendingJobs((prev) => prev.filter((item) => item.job_id !== jobId))
  }

  function hasDraftProducingJobs(jobs: AsyncConversationJob[]): boolean {
    return jobs.some((job) => job.kind === "scan_threads")
  }

  function stageDeferredJob(signal: DeferredJobSignal) {
    upsertPendingJob({
      job_id: signal.job_id,
      kind: signal.kind,
      status: "queued",
      progress: 0,
      updated_at: Date.now(),
      based_on_revision: signal.based_on_revision,
      mode: signal.mode,
    })
  }

  async function acceptDraftReview() {
    if (!draftReview || !activeConversationId) return
    const summary = trimDraftText(draftSummaryInput)
    if (!summary) {
      showHeaderNavHint("Opsummeringen må ikke være tom")
      return
    }

    setDraftSaving(true)
    try {
      const res = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          conversationId: activeConversationId,
          jobId: draftReview.job_id,
          accepted: true,
          summary,
          open_questions: parseOpenQuestions(draftOpenQuestionsInput),
        }),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`Jobs accept: HTTP ${res.status}${txt ? ` — ${txt}` : ""}`)
      }
      applyDraftToEditor(null)
      showHeaderNavHint("Opsummering gemt")
    } catch (e: any) {
      showHeaderNavHint(e?.message ? String(e.message) : "Kunne ikke gemme opsummering")
    } finally {
      setDraftSaving(false)
    }
  }

  async function runPendingJob(conversationId: string, job: AsyncConversationJob) {
    if (!conversationId) return
    if (jobLoopRef.current) return

    const loop = { conversationId, jobId: job.job_id, cancelled: false }
    jobLoopRef.current = loop
    const silentJob = job.kind === "derive_thread_title"
    if (!silentJob) {
      setJobRunnerState({
        jobId: job.job_id,
        label: statusLabelForJob(job),
        progress: typeof job.progress === "number" ? job.progress : 0,
        status: job.status,
        error: null,
      })
    }

    try {
      const startRes = await fetch("/api/jobs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId: job.job_id, basedOnRevision: job.based_on_revision ?? null }),
      })
      if (!startRes.ok) throw new Error(`Jobs start: HTTP ${startRes.status}`)
      const startData = (await startRes.json().catch(() => null)) as any
      if (startData?.status === "busy") {
        if (!silentJob) {
          setJobRunnerState({
            jobId: job.job_id,
            label: "En anden opgave kører allerede…",
            progress: typeof job.progress === "number" ? job.progress : 0,
            status: "busy",
            error: null,
          })
        }
        return
      }
      if (startData?.stale || startData?.status === "canceled") {
        removePendingJob(job.job_id)
        setJobRunnerState(null)
        return
      }

      let attempts = 0
      while (!loop.cancelled) {
        const tickRes = await fetch("/api/jobs/tick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ jobId: job.job_id, basedOnRevision: job.based_on_revision ?? null }),
        })
        if (!tickRes.ok) throw new Error(`Jobs tick: HTTP ${tickRes.status}`)
        const tick = (await tickRes.json().catch(() => null)) as any
        const progress = typeof tick?.progress === "number" ? tick.progress : 0
        if (!silentJob) {
          setJobRunnerState({
            jobId: job.job_id,
            label: statusLabelForJob({ kind: job.kind, cursor: tick?.cursor, status: tick?.status }),
            progress,
            status: String(tick?.status ?? "running"),
            error: tick?.lastError ? String(tick.lastError) : null,
          })
        }

        const status = String(tick?.status ?? "")
        if (status === "completed") {
          const jobs = await fetchPendingJobs(conversationId).catch(() => [] as AsyncConversationJob[])
          if (hasDraftProducingJobs(jobs)) {
            await fetchLatestDraft(conversationId).catch(() => null)
          }
          break
        }
        if (status === "failed" || status === "canceled") {
          removePendingJob(job.job_id)
          await fetchPendingJobs(conversationId).catch(() => [])
          break
        }

        attempts += 1
        const nextDelay = attempts < 10 ? 1000 : attempts < 30 ? 2000 : 5000
        await delay(nextDelay)
      }
    } catch (e: any) {
      if (!silentJob) {
        setJobRunnerState((prev) =>
          prev && prev.jobId === job.job_id
            ? { ...prev, status: "failed", error: e?.message ? String(e.message) : "Baggrundsopgave fejlede" }
            : prev
        )
      }
    } finally {
      if (jobLoopRef.current === loop) jobLoopRef.current = null
      if (!loop.cancelled && !silentJob) {
        setJobRunnerState((prev) => (prev && prev.jobId === job.job_id && prev.status !== "failed" ? null : prev))
      }
    }
  }

  useEffect(() => {
    if (!open) return
    scrollChatToBottom()
    // Retry after potential keyboard/layout shifts on mobile
    const t = window.setTimeout(() => scrollChatToBottom(), 200)
    return () => window.clearTimeout(t)
  }, [visibleMessages, open, headerNavHint, expanded])

  useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(max-width: 768px)")
    const updateMobileViewport = () => {
      setIsMobileViewport(media.matches)
    }

    updateMobileViewport()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateMobileViewport)
      return () => media.removeEventListener("change", updateMobileViewport)
    }

    media.addListener(updateMobileViewport)
    return () => media.removeListener(updateMobileViewport)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const ua = navigator.userAgent || ""
    const vendor = navigator.vendor || ""
    const referrer = document.referrer || ""

    const matchesInAppBrowser = /(FBAN|FBAV|Messenger|Instagram|Line\/|MicroMessenger|wv\))/i.test(ua)
      || /FB_IAB|FB4A/i.test(ua)
      || /Instagram/i.test(vendor)
      || /facebook\.com|messenger\.com/i.test(referrer)

    setIsInAppBrowser(matchesInAppBrowser)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    syncViewportHeight()
    syncComposerMetrics()

    const viewport = window.visualViewport
    const handleResize = () => {
      syncViewportHeight()
      window.requestAnimationFrame(() => {
        syncComposerMetrics()
        if (open) {
          scheduleComposerIntoView(80)
        }
      })
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleResize)
    viewport?.addEventListener("resize", handleResize)
    viewport?.addEventListener("scroll", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleResize)
      viewport?.removeEventListener("resize", handleResize)
      viewport?.removeEventListener("scroll", handleResize)
    }
  }, [open])

  // ─── Inaktivitets-timer: start/stop med chat open/closed ──────────────────
  useEffect(() => {
    if (!open) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      setSessionCloseVisible(false)
      return
    }
    resetInactivityTimer(state)
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    document.body.classList.toggle("chatbotMobileOpen", open && isMobileViewport)
    return () => {
      document.body.classList.remove("chatbotMobileOpen")
    }
  }, [open, isMobileViewport])

  useEffect(() => {
    if (!open) return
    if (!draftReview || draftReview.accepted_at) return
    scrollChatToBottom()
  }, [open, draftReview?.job_id, draftReview?.accepted_at])

  useEffect(() => {
    if (!open) return
    if (!state) return
    if (loading) return
    if (threadsOpen) return
    focusInput()
  }, [open, loading, threadsOpen, state?.revision, visibleMessages.length])

  // Nulstil inaktivitets-timer når der ankommer nye beskeder
  useEffect(() => {
    if (!open || !state) return
    resetInactivityTimer(state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.revision])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      syncComposerMetrics()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open, isMobileViewport, expanded, input, visibleMessages.length, loading, draftReview?.job_id, draftReview?.accepted_at])

  useEffect(() => {
    return () => {
      if (headerNavHintTimerRef.current) {
        window.clearTimeout(headerNavHintTimerRef.current)
        headerNavHintTimerRef.current = null
      }
      if (jobLoopRef.current) jobLoopRef.current.cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open || !activeConversationId) return

    const refresh = async () => {
      try {
        const jobs = await fetchPendingJobs(activeConversationId)
        const shouldFetchDraft = hasDraftProducingJobs(jobs) || (!!draftReview && !draftReview.accepted_at)
        if (shouldFetchDraft) {
          await fetchLatestDraft(activeConversationId)
        }
      } catch {
        // Best effort only.
      }
    }

    refresh()
    const interval = window.setInterval(refresh, 15000)
    const onVisible = () => {
      if (!document.hidden) refresh()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
      if (jobLoopRef.current && jobLoopRef.current.conversationId === activeConversationId) {
        jobLoopRef.current.cancelled = true
        jobLoopRef.current = null
      }
      setPendingJobs([])
      setJobRunnerState(null)
      applyDraftToEditor(null)
    }
  }, [open, activeConversationId, draftReview?.job_id, draftReview?.accepted_at])

  useEffect(() => {
    if (!open || !activeConversationId) return
    if (draftReview && !draftReview.accepted_at) return
    if (jobLoopRef.current) return
    const next = pendingJobs.find((job) => job.status === "queued" || job.status === "running")
    if (!next) return
    runPendingJob(activeConversationId, next)
  }, [open, activeConversationId, pendingJobs, draftReview?.job_id, draftReview?.accepted_at])

  function appendAssistantMessage(conversationId: string, text: string, meta?: { revision?: number; nodeId?: string }) {
    const message = (text ?? "").trim()
    if (!message) return

    setMessagesByConversationId((prev) => {
      const current = prev[conversationId] ?? []
      const last = current.length ? current[current.length - 1] : null
      if (last && last.role === "assistant" && last.text.trim() === message) return prev
      return {
        ...prev,
        [conversationId]: [
          ...current,
          { id: `assistant-${safeId()}`, role: "assistant", text: message, revision: meta?.revision, nodeId: meta?.nodeId },
        ],
      }
    })
  }

  function isFormSubmission(text: string): boolean {
    const lines = text.trim().split(/\n/)
    const formLines = lines.filter((l) => /^[a-z_]+: .+/i.test(l.trim()))
    return lines.length >= 2 && formLines.length >= Math.ceil(lines.length * 0.6)
  }

  function appendUserMessage(conversationId: string, text: string) {
    const message = (text ?? "").trim()
    if (!message) return
    if (isFormSubmission(message)) return
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

      if (m.role === "user") {
        if (isThreadControlText(text)) continue
        if (text.startsWith("UI_ACTION:")) continue
        if (text.startsWith("EXPLICIT_TRANSITION:")) continue
        if (text.startsWith("THREAD_")) continue
        if (text.startsWith("SYSTEM")) continue
        const fLines = text.trim().split(/\n/)
        const fMatches = fLines.filter((l: string) => /^[a-z_]+: .+/i.test(l.trim()))
        if (fLines.length >= 2 && fMatches.length >= Math.ceil(fLines.length * 0.6)) continue
      }

      out.push({
        id: `${conversationId}:${i}:${m.role}`,
        role: m.role,
        text,
        revision: typeof m.revision === "number" ? m.revision : undefined,
        nodeId: typeof m.node_id === "string" ? m.node_id : undefined,
      })
    }
    return out
  }

  async function ensureConversationLoaded(conversationId: string, s?: ConversationState) {
    if (!conversationId) return
    if (loadedConversationsRef.current.has(conversationId)) return

    const transcript = await loadTranscript(conversationId)
    loadedConversationsRef.current.add(conversationId)
    setMessagesByConversationId((prev) => ({ ...prev, [conversationId]: transcript }))

    if (!transcript.length && s) {
      const welcome = normalizeAssistantMessage(s)
      if (welcome?.trim()) {
        setMessagesByConversationId((prev) => {
          const cur = prev[conversationId] ?? []
          if (cur.length) return prev
          return {
            ...prev,
            [conversationId]: [{ id: `assistant-${safeId()}`, role: "assistant", text: welcome.trim(), revision: s.revision, nodeId: s.active_node }],
          }
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

  async function fetchThreadsIndex(): Promise<ThreadsIndexResponse | null> {
    const res = await fetch("/api/threads", {
      credentials: "include",
      cache: "no-store",
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`Threads: HTTP ${res.status}`)
    }

    return (await res.json().catch(() => null)) as ThreadsIndexResponse | null
  }

  async function fetchConversationState(conversationId: string): Promise<ConversationState | null> {
    const res = await fetch(`/api/state?conversationId=${encodeURIComponent(conversationId)}`, {
      credentials: "include",
      cache: "no-store",
    })

    if (!res.ok) {
      if (res.status === 404) return null
      throw new Error(`State: HTTP ${res.status}`)
    }

    const data = (await res.json().catch(() => null)) as ConversationState | null
    if (!data?.conversation_id) return null
    return data
  }

  function isRestorableState(s: ConversationState | null | undefined): s is ConversationState {
    if (!s) return false
    if (!s.conversation_id) return false
    if (s.status === "completed" || s.status === "rejected") return false
    return true
  }

  async function tryRestoreActiveConversation(): Promise<ConversationState | null> {
    const threads = await fetchThreadsIndex()
    const restoredConversationId = String(threads?.active_conversation_id ?? "").trim()

    if (!restoredConversationId) return null

    const restored = await fetchConversationState(restoredConversationId)
    if (!isRestorableState(restored)) return null

    return restored
  }

  async function callKernel(nextState: ConversationState | null, nextInput: InputSignal) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ state: nextState, input: nextInput }),
    })

    if (!res.ok) {
      if (res.status === 409) {
        const json = await res.json().catch(() => null)
        const msg = json?.error?.message || "Handlingen kunne ikke udføres."
        setHeaderNavHint(msg)
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
    if (initInFlightRef.current) return
    initInFlightRef.current = true

    setLoading(true)
    didAutoStartNewThreadRef.current = false

    try {
      const restored = await tryRestoreActiveConversation()

      if (restored) {
        setState(restored)
        setInput("")
        setHeaderNavHint(null)
        await ensureConversationLoaded(restored.conversation_id, restored)
        return
      }

      const threadsIndex = await fetchThreadsIndex().catch(() => null)
      const existingThreads = Array.isArray(threadsIndex?.threads) ? threadsIndex.threads : []
      const fallbackConversationId = String(existingThreads[0]?.conversation_id ?? "").trim()

      if (fallbackConversationId) {
        const fallbackState = await fetchConversationState(fallbackConversationId).catch(() => null)
        if (isRestorableState(fallbackState)) {
          setState(fallbackState)
          setInput("")
          setHeaderNavHint(null)
          await ensureConversationLoaded(fallbackState.conversation_id, fallbackState)
          return
        }
      }

      const data = await callKernel(null, { type: "THREAD_CREATE", mode: "normal" } as any)
      setState(data.state)
      setNodeForm((data as any).node_form ?? null)
      setNodeAllowFreeText((data as any).node_allow_free_text ?? true)
      setNodeAllowedExits((data as any).node_allowed_exits ?? [])
      setNodeAllowFreeText((data as any).node_allow_free_text ?? true)
      setNodeAllowedExits((data as any).node_allowed_exits ?? [])
      setInput("")
      setHeaderNavHint(null)
      await ensureConversationLoaded(data.state.conversation_id, data.state)
    } finally {
      initInFlightRef.current = false
      setLoading(false)
    }
  }

  async function dispatch(nextInput: InputSignal, opts?: { silentUser?: boolean }): Promise<boolean> {
    if (!state) return false
    // Nulstil inaktivitets-timer ved enhver bruger-handling
    resetInactivityTimer(state)
    // Optimistically clear form UI on navigation
    if (nextInput.type === "EXPLICIT_TRANSITION") {
      setNodeForm(null)
      setNodeAllowFreeText(true)
    }
    setLoading(true)

    try {
      const fromNode = state.active_node
      const data: any = await callKernel(state, nextInput)

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
        if (state.conversation_id) appendUserMessage(state.conversation_id, nextInput.text)
      }

      setState(data.state)
      setNodeForm((data as any).node_form ?? null)
      setNodeAllowFreeText((data as any).node_allow_free_text ?? true)
      setNodeAllowedExits((data as any).node_allowed_exits ?? [])

      if (data.deferred_job && data.state?.conversation_id) {
        stageDeferredJob(data.deferred_job)
      }

      const assistantText =
        (data.transition?.response_message as string | undefined) ?? normalizeAssistantMessage(data.state)

      if (isThreadNav) {
        setInput("")
        setHeaderNavHint(null)
        await ensureConversationLoaded(data.state.conversation_id, data.state)
      } else {
        if (state.conversation_id) {
          appendAssistantMessage(state.conversation_id, assistantText, {
            revision: typeof data?.state?.revision === "number" ? data.state.revision : undefined,
            nodeId: typeof data?.state?.active_node === "string" ? data.state.active_node : undefined,
          })
        }
      }
      return true
    } finally {
      setLoading(false)
    }
  }

  function openChat() {
    setOpen(true)
    if (!state && !loading) {
      void init()
    }
  }

  function closeChat() {
    setOpen(false)
    setExpanded(false)
  }

  function toggleExpanded() {
    setExpanded((v) => !v)
  }

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



  const composerDetached = open && isMobileViewport
  const containerClass = `${styles.chatbot} ${expanded ? styles.expanded : styles.normal} ${composerDetached ? styles.chatbotDetachedComposer : ""}`
  const footerClass = `${styles.footer}${composerDetached ? ` ${styles.footerDetached}` : ""}`

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
            {isUnsupportedInAppBrowser ? (
              <div className={styles.fallbackPanel}>
                <div className={styles.fallbackBody}>
                  <h2 className={styles.fallbackTitle}>Åbn siden i din browser</h2>
                  <p className={styles.fallbackText}>
                    Chatten fungerer ikke stabilt i indbyggede browsere fra sociale apps som Facebook og Messenger på Android.
                  </p>
                  <p className={styles.fallbackText}>
                    Åbn siden i Chrome eller din standardbrowser for at bruge chatten.
                  </p>

                  <div className={styles.fallbackActions}>
                    <button type="button" className={styles.fallbackPrimaryBtn} onClick={openCurrentPageInBrowser}>
                      Åbn i browser
                    </button>
                    <button type="button" className={styles.fallbackSecondaryBtn} onClick={copyCurrentPageLink}>
                      {copyLinkLabel}
                    </button>
                  </div>

                  <div className={styles.fallbackHelp}>
                    <p className={styles.fallbackHelpTitle}>Hvis knappen ikke åbner eksternt:</p>
                    <ol className={styles.fallbackSteps}>
                      <li>Tryk på menuen øverst til højre i app-browseren.</li>
                      <li>Vælg “Åbn i browser”.</li>
                      <li>Fortsæt derefter i Chrome eller din standardbrowser.</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <ChatHeader
                  loading={loading}
                  expanded={expanded}
                  activeNodeLabel={activeNodeLabel}
                  toggleExpanded={toggleExpanded}
                  closeChat={closeChat}
                  threadsOpen={threadsOpen}
                  setThreadsOpen={setThreadsOpen}
                  threadTabs={threadTabs}
                  activeConversationId={activeConversationId}
                  state={state}
                  dispatch={dispatch}
                  focusInput={focusInput}
                  headerNavHint={headerNavHint}
                />

                <MessagePane
                  visibleMessages={visibleMessages}
                  state={state}
                  loading={loading}
                  freeTextEnabled={freeTextEnabled}
                  uiSuggestions={uiSuggestions}
                  dispatch={dispatch}
                  endRef={endRef}
                  asyncJobStatus={jobRunnerState}
                  draftReview={
                    draftReview && !draftReview.accepted_at
                      ? {
                          draft: draftReview,
                          summary: draftSummaryInput,
                          openQuestionsText: draftOpenQuestionsInput,
                          saving: draftSaving,
                          onSummaryChange: setDraftSummaryInput,
                          onOpenQuestionsChange: setDraftOpenQuestionsInput,
                          onAccept: acceptDraftReview,
                          onReset: () => applyDraftToEditor(draftReview),
                        }
                      : null
                  }
                  sessionClose={
                    sessionCloseVisible && state
                      ? {
                          trigger: "inactivity",
                          onClose: () => {
                            setSessionCloseVisible(false)
                            setOpen(false)
                          },
                          onContinue: () => {
                            setSessionCloseVisible(false)
                            resetInactivityTimer(state)
                            focusInput()
                          },
                        }
                      : null
                  }
                />

                {!composerDetached && (
                  <div ref={footerRef} className={footerClass}>
                    {nodeForm ? (
                      <FormComposer
                        fields={nodeForm.fields}
                        loading={loading}
                        disabled={!state || !freeTextEnabled}
                        onCancel={() => dispatch({ type: "EXPLICIT_TRANSITION", target: "GEN_HYPNO" })}
                        secondaryAction={state?.active_node === "HANDOFF_FORM" ? {
                          label: "Ikke klar nu — efterlad kun din email",
                          onClick: () => dispatch({ type: "EXPLICIT_TRANSITION", target: "LEAD_CAPTURE" })
                        } : undefined}
                        onSend={(text) => {
                          dispatch({ type: "FREE_TEXT", text })
                        }}
                      />
                    ) : !nodeAllowFreeText && nodeAllowedExits.length > 0 ? (
                      <div className={styles.infoActions}>
                        {nodeAllowedExits.slice(0, 3).map((exitId) => (
                          <button
                            key={exitId}
                            className={styles.infoActionBtn}
                            onClick={() => dispatch({ type: "EXPLICIT_TRANSITION", target: exitId })}
                            disabled={loading}
                          >
                            {exitId === "HOME" ? "Gå til forsiden" : exitId === "GEN_HYPNO" ? "Fortsæt samtalen" : NODE_LABELS[exitId] ?? exitId}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <ChatComposer
                        textareaRef={textareaRef}
                        value={input}
                        placeholder={placeholder}
                        disabled={!state || !freeTextEnabled}
                        loading={loading}
                        onChange={setInput}
                        onFocus={() => {
                          scheduleComposerIntoView()
                        }}
                        onSend={(text) => {
                          setInput("")
                          dispatch({ type: "FREE_TEXT", text })
                        }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {composerDetached && !isUnsupportedInAppBrowser && (
            <div ref={footerRef} className={footerClass} onClick={(e) => e.stopPropagation()}>
              {nodeForm ? (
                <FormComposer
                  fields={nodeForm.fields}
                  loading={loading}
                  disabled={!state || !freeTextEnabled}
                  onCancel={() => dispatch({ type: "EXPLICIT_TRANSITION", target: "GEN_HYPNO" })}
                  secondaryAction={state?.active_node === "HANDOFF_FORM" ? {
                    label: "Ikke klar nu — efterlad kun din email",
                    onClick: () => dispatch({ type: "EXPLICIT_TRANSITION", target: "LEAD_CAPTURE" })
                  } : undefined}
                  onSend={(text) => {
                    dispatch({ type: "FREE_TEXT", text })
                  }}
                />
              ) : !nodeAllowFreeText && nodeAllowedExits.length > 0 ? (
                <div className={styles.infoActions}>
                  {nodeAllowedExits.slice(0, 3).map((exitId) => (
                    <button
                      key={exitId}
                      className={styles.infoActionBtn}
                      onClick={() => dispatch({ type: "EXPLICIT_TRANSITION", target: exitId })}
                      disabled={loading}
                    >
                      {exitId === "HOME" ? "Gå til forsiden" : exitId === "GEN_HYPNO" ? "Fortsæt samtalen" : NODE_LABELS[exitId] ?? exitId}
                    </button>
                  ))}
                </div>
              ) : (
                <ChatComposer
                  textareaRef={textareaRef}
                  value={input}
                  placeholder={placeholder}
                  disabled={!state || !freeTextEnabled}
                  loading={loading}
                  onChange={setInput}
                  onFocus={() => {
                    scheduleComposerIntoView()
                  }}
                  onSend={(text) => {
                    setInput("")
                    dispatch({ type: "FREE_TEXT", text })
                  }}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
