"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"

import styles from "../Chatbot.module.css"

import type { AsyncDraft, ChatMessage, ConversationState, InputSignal, UiSuggestion } from "./types"

type FeedbackRating = "positive" | "partial" | "negative"
type FeedbackTag =
  | "helpful"
  | "too_interpretive"
  | "too_directive"
  | "too_generic"
  | "not_concrete"
  | "misunderstood"
  | "too_reflective"
  | "other"

const NEGATIVE_TAG_OPTIONS: Array<{ value: FeedbackTag; label: string }> = [
  { value: "too_interpretive", label: "For fortolkende" },
  { value: "too_directive", label: "For styrende" },
  { value: "too_generic", label: "For generisk" },
  { value: "not_concrete", label: "Ikke konkret nok" },
  { value: "misunderstood", label: "Misforstod mig" },
  { value: "too_reflective", label: "For meget fokus på refleksion" },
  { value: "other", label: "Andet" },
]

export type MessagePaneProps = {
  visibleMessages: ChatMessage[]
  state: ConversationState | null
  loading: boolean
  freeTextEnabled: boolean
  uiSuggestions: UiSuggestion[]
  dispatch: (input: InputSignal, opts?: { silentUser?: boolean }) => Promise<boolean> | boolean
  endRef: React.RefObject<HTMLDivElement>
  asyncJobStatus?: {
    label: string
    progress?: number
    status?: string
    error?: string | null
  } | null
  draftReview?: {
    draft: AsyncDraft
    summary: string
    openQuestionsText: string
    saving: boolean
    onSummaryChange: (value: string) => void
    onOpenQuestionsChange: (value: string) => void
    onAccept: () => void
    onReset: () => void
  } | null
}

function formatEvidenceLine(e: AsyncDraft["evidence"][number]) {
  const from = typeof e.revision_from === "number" ? e.revision_from : null
  const to = typeof e.revision_to === "number" ? e.revision_to : null
  if (from !== null && to !== null) return `${e.conversation_id} · rev ${from}-${to}`
  if (from !== null) return `${e.conversation_id} · rev ${from}`
  return e.conversation_id
}

function FeedbackBox(props: {
  message: ChatMessage
  messageIndex: number
  conversationId: string
  node?: string
  mode?: string
  move?: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([])
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    if (!rating || saving) return false
    if (rating === "positive") return true
    return selectedTags.length > 0 || note.trim().length > 0
  }, [rating, saving, selectedTags, note])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function openFeedback(nextRating?: FeedbackRating) {
    setOpen(true)
    setError(null)
    if (nextRating) setRating(nextRating)
  }

  function closeFeedback() {
    if (saving) return
    setOpen(false)
    setError(null)
  }

  function toggleTag(tag: FeedbackTag) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  async function submit() {
    if (!canSubmit || !rating) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        conversationId: props.conversationId,
        revision: props.message.revision,
        messageIndex: props.messageIndex,
        rating,
        tags: rating === "positive" ? ["helpful"] : selectedTags,
        note: note.trim() || undefined,
        meta: {
          node: props.node,
          mode: props.mode,
          move: props.move,
        },
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(typeof data?.error === "string" ? data.error : `HTTP ${res.status}`)
      }

      setSubmitted(true)
      setOpen(false)
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Kunne ikke gemme feedback")
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return <div className={styles.feedbackSaved}>Tak for feedback.</div>
  }

  return (
    <div className={styles.feedbackWrap}>
      <div className={styles.feedbackInline}>
        {props.compact ? (
          <button
            type="button"
            className={styles.feedbackTextButton}
            onClick={() => openFeedback()}
            aria-label="Giv feedback"
            title="Giv feedback"
          >
            Feedback
          </button>
        ) : (
          <>
            <span className={styles.feedbackPrompt}>Hjalp dette?</span>
            <button type="button" className={styles.feedbackChip} onClick={() => openFeedback("positive")}>Ja</button>
            <button type="button" className={styles.feedbackChip} onClick={() => openFeedback("partial")}>Delvist</button>
            <button type="button" className={styles.feedbackChip} onClick={() => openFeedback("negative")}>Nej</button>
          </>
        )}
      </div>

      {open ? (
        <div className={styles.feedbackModal} role="dialog" aria-modal="true" aria-label="Feedback">
          <button type="button" className={styles.feedbackBackdrop} onClick={closeFeedback} aria-label="Luk feedback" />
          <div className={styles.feedbackDialog}>
            <div className={styles.feedbackDialogHeader}>
              <div className={styles.feedbackDialogTitle}>Feedback</div>
              <button type="button" className={styles.feedbackCloseButton} onClick={closeFeedback} disabled={saving} aria-label="Luk feedback">×</button>
            </div>

            <div className={styles.feedbackPanel}>
              <div className={styles.feedbackSection}>
                <div className={styles.feedbackSectionTitle}>Vurdering</div>
                <div className={styles.feedbackChoiceRow}>
                  <button type="button" className={`${styles.feedbackChoice} ${rating === "positive" ? styles.feedbackChoiceActive : ""}`} onClick={() => setRating("positive")}>Ja</button>
                  <button type="button" className={`${styles.feedbackChoice} ${rating === "partial" ? styles.feedbackChoiceActive : ""}`} onClick={() => setRating("partial")}>Delvist</button>
                  <button type="button" className={`${styles.feedbackChoice} ${rating === "negative" ? styles.feedbackChoiceActive : ""}`} onClick={() => setRating("negative")}>Nej</button>
                </div>
              </div>

              {rating === "positive" ? (
                <label className={styles.feedbackLabel}>
                  <span>Hvad var hjælpsomt? (valgfrit)</span>
                  <textarea className={styles.feedbackTextarea} value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} />
                </label>
              ) : (
                <>
                  <div className={styles.feedbackSection}>
                    <div className={styles.feedbackSectionTitle}>Hvad var problemet?</div>
                    <div className={styles.feedbackTagGrid}>
                      {NEGATIVE_TAG_OPTIONS.map((option) => {
                        const active = selectedTags.includes(option.value)
                        return (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.feedbackTag} ${active ? styles.feedbackTagActive : ""}`}
                            onClick={() => toggleTag(option.value)}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <label className={styles.feedbackLabel}>
                    <span>Uddyb gerne (valgfrit)</span>
                    <textarea className={styles.feedbackTextarea} value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000} />
                  </label>
                </>
              )}

              {error ? <div className={styles.feedbackError}>{error}</div> : null}

              <div className={styles.feedbackActions}>
                <button type="button" className={styles.feedbackPrimary} onClick={submit} disabled={!canSubmit}>
                  {saving ? "Gemmer…" : "Send feedback"}
                </button>
                <button type="button" className={styles.feedbackSecondary} onClick={closeFeedback} disabled={saving}>
                  Luk
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function MessagePane(props: MessagePaneProps) {
  const router = useRouter()
  const conversationId = props.state?.conversation_id ?? null
  const feedbackMode = (() => {
    const entry = props.state?.meta?.["dialog.mode"]
    return entry && typeof entry === "object" && "value" in entry ? String((entry as any).value ?? "") : typeof entry === "string" ? entry : undefined
  })()
  const feedbackMove = (() => {
    const entry = props.state?.meta?.["dialog.move"]
    return entry && typeof entry === "object" && "value" in entry ? String((entry as any).value ?? "") : typeof entry === "string" ? entry : undefined
  })()

  return (
    <div className={styles.messages}>
      {props.visibleMessages.map((m, index) => (
        <div key={m.id} className={styles.messageStack}>
          <div className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}>{m.text}</div>
          {m.role === "assistant" && typeof m.revision === "number" && m.revision === 0 && props.visibleMessages.length === 1 && !props.loading && (
            <div className={styles.starterChips}>
              {["Hvad koster et forløb?", "Hvad sker der under hypnose?", "Passer det til mig?"].map((q) => (
                <button
                  key={q}
                  className={styles.starterChip}
                  onClick={() => props.dispatch({ type: "FREE_TEXT", text: q })}
                  disabled={props.loading || !props.freeTextEnabled}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {m.role === "assistant" && conversationId ? (
            (() => {
              const revision = typeof m.revision === "number" ? m.revision : null
              if (revision === 0) return null
              return (
                <FeedbackBox
                  message={m}
                  messageIndex={index}
                  conversationId={conversationId}
                  node={m.nodeId || props.state?.active_node}
                  mode={feedbackMode}
                  move={feedbackMove}
                  compact={revision === 1}
                />
              )
            })()
          ) : null}
        </div>
      ))}

      {props.asyncJobStatus && (
        <div className={styles.callout}>
          <div className={styles.calloutTitle}>Baggrundsopgave</div>
          <div className={styles.jobStatusRow}>
            <div className={styles.jobStatusText}>{props.asyncJobStatus.label}</div>
            {typeof props.asyncJobStatus.progress === "number" ? (
              <div className={styles.jobStatusMeta}>{Math.round(props.asyncJobStatus.progress * 100)}%</div>
            ) : null}
          </div>
          {typeof props.asyncJobStatus.progress === "number" ? (
            <div className={styles.jobProgressTrack} aria-hidden="true">
              <div className={styles.jobProgressBar} style={{ width: `${Math.max(0, Math.min(100, Math.round(props.asyncJobStatus.progress * 100)))}%` }} />
            </div>
          ) : null}
          {props.asyncJobStatus.error ? <div className={styles.jobStatusError}>{props.asyncJobStatus.error}</div> : null}
        </div>
      )}

      {props.draftReview && (
        <div className={styles.callout}>
          <div className={styles.calloutTitle}>Forslag fra tidligere tråde</div>
          <div className={styles.draftReviewText}>Gennemgå opsummeringen, ret den hvis nødvendigt, og acceptér først når den passer.</div>
          <label className={styles.draftLabel}>
            <span>Opsummering</span>
            <textarea
              className={styles.draftTextarea}
              value={props.draftReview.summary}
              onChange={(e) => props.draftReview?.onSummaryChange(e.target.value)}
              rows={7}
              disabled={props.draftReview.saving}
            />
          </label>
          <label className={styles.draftLabel}>
            <span>Åbne spørgsmål (én pr. linje)</span>
            <textarea
              className={styles.draftTextarea}
              value={props.draftReview.openQuestionsText}
              onChange={(e) => props.draftReview?.onOpenQuestionsChange(e.target.value)}
              rows={4}
              disabled={props.draftReview.saving}
            />
          </label>
          {props.draftReview.draft.evidence.length > 0 ? (
            <div>
              <div className={styles.sectionTitle}>Kilder</div>
              <div className={styles.draftEvidenceList}>
                {props.draftReview.draft.evidence.slice(0, 6).map((e, idx) => (
                  <div key={`${e.conversation_id}:${idx}`} className={styles.draftEvidenceItem}>{formatEvidenceLine(e)}</div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={styles.calloutRow}>
            <button className={styles.chipAction} onClick={props.draftReview.onAccept} disabled={props.draftReview.saving}>
              {props.draftReview.saving ? "Gemmer…" : "Acceptér opsummering"}
            </button>
            <button className={styles.chipAction} onClick={props.draftReview.onReset} disabled={props.draftReview.saving}>
              Nulstil ændringer
            </button>
          </div>
        </div>
      )}

      {props.state?.status === "completed" && (
        <div className={styles.callout}>
          <div className={styles.calloutTitle}>Næste</div>
          <div className={styles.calloutRow}>
            <button
              className={styles.chipAction}
              onClick={() => props.dispatch({ type: "FREE_TEXT", text: "new" }, { silentUser: true })}
              disabled={props.loading || !props.state}
            >
              Ny tråd
            </button>
          </div>
        </div>
      )}

      {props.uiSuggestions.length > 0 && (
        <div className="mt-3">
          <div className={styles.sectionTitle}>Forslag</div>
          <div className={styles.calloutRow}>
            {props.uiSuggestions.map((s) => (
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
                    props.dispatch(input as InputSignal, { silentUser: true })
                  } else {
                    props.dispatch({ type: "FREE_TEXT", text: s.label })
                  }
                }}
                disabled={props.loading || !props.state || !props.freeTextEnabled}
                title={s.label}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={props.endRef} />
    </div>
  )
}
