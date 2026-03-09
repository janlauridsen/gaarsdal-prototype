"use client"

import type React from "react"
import { useRouter } from "next/router"

import styles from "../Chatbot.module.css"

import type { AsyncDraft, ConversationState, InputSignal, UiSuggestion } from "./types"

export type MessagePaneProps = {
  isJournalActive: boolean
  visibleMessages: Array<{ id: string; role: "user" | "assistant"; text: string }>
  journalEntries: any[]
  journalTitle: string
  journalProfile: "general" | "alcohol" | "strict"
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

      {!props.isJournalActive &&
        props.visibleMessages.map((m) => (
          <div key={m.id} className={`${styles.message} ${m.role === "assistant" ? styles.messageBot : styles.messageUser}`}>
            {m.text}
          </div>
        ))}

      {props.isJournalActive && (
        <div className={styles.journalWrap}>
          {props.journalEntries.length === 0 ? (
            <div className={styles.journalEmpty}>
              <div className={styles.journalEmptyTitle}>{props.journalTitle ? `Dagbog – ${props.journalTitle}` : "Dagbog"}</div>
              <div className={styles.journalEmptyText}>
                {props.journalProfile === "alcohol"
                  ? "Skriv et kort notat og evt. drinks + urge (0–10)."
                  : props.journalProfile === "strict"
                    ? "Skriv et kort notat og en skala (0–10)."
                    : "Skriv et kort notat."}
              </div>
            </div>
          ) : (
            <div className={styles.journalList}>
              {props.journalEntries
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
                          {typeof drinks === "number" ? <span className={styles.journalChip}>Drinks: {drinks}</span> : null}
                          {typeof urge === "number" ? <span className={styles.journalChip}>Urge: {urge}/10</span> : null}
                          {typeof moodTag === "string" && moodTag.trim() ? <span className={styles.journalChip}>Sind: {moodTag}</span> : null}
                          {typeof mood === "number" ? <span className={styles.journalChip}>Sind: {mood}/10</span> : null}
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
                          {typeof cravingPeak === "number" ? <span className={styles.journalChip}>Craving: {cravingPeak}/10</span> : null}
                          {typeof cravingDur === "number" ? <span className={styles.journalChip}>Varighed: {cravingDur}m</span> : null}
                          {typeof strict === "number" ? <span className={styles.journalChip}>Skala: {strict}/10</span> : null}
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
