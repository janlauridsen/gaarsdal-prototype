"use client"

import type React from "react"
import { useRouter } from "next/router"

import styles from "../Chatbot.module.css"

import type { AsyncDraft, ConversationState, InputSignal, UiSuggestion } from "./types"

export type MessagePaneProps = {
  visibleMessages: Array<{ id: string; role: "user" | "assistant"; text: string }>
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

export function MessagePane(props: MessagePaneProps) {
  const router = useRouter()

  return (
    <div className={styles.messages}>
      {props.visibleMessages.map((m) => (
        <div key={m.id} className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}>
          {m.text}
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
