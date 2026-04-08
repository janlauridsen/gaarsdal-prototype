"use client"

import { useState } from "react"
import type { ConversationState } from "./types"
import styles from "../Chatbot.module.css"

function readMeta(state: ConversationState, key: string): unknown {
  const entry = state.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) {
    return (entry as any).value
  }
  return entry
}

function buildClosingSummary(state: ConversationState): string | null {
  const topic = readMeta(state, "gen_hypno.last_topic")
  const problemSummary = readMeta(state, "gen_hypno.problem_summary")
  const turnCount = readMeta(state, "gen_hypno.assistant_turn_count")
  const stage = readMeta(state, "dialog.stage")

  if (typeof turnCount !== "number" || turnCount < 2) return null
  if (typeof topic !== "string" || !topic.trim()) return null

  const t = topic.trim()

  if (typeof problemSummary === "string" && problemSummary.trim().length > 12) {
    return `Du var inde på ${t} i denne samtale. ${problemSummary.trim()}`
  }

  if (stage === "explore_patterns") {
    return `Du undersøgte mønstre omkring ${t}. Det tager tid at se sine egne mønstre klart — det er en god start.`
  }

  return `Du var inde på ${t} i denne samtale. Du kan vende tilbage og fortsætte, når det passer dig.`
}

export type SessionCloseProps = {
  state: ConversationState
  onClose: () => void
  onContinue: () => void
  trigger: "inactivity" | "closing_mode"
}

export function SessionClose({ state, onClose, onContinue, trigger }: SessionCloseProps) {
  const summary = buildClosingSummary(state)
  const isClosingMode = trigger === "closing_mode"

  const [feedbackGiven, setFeedbackGiven] = useState<"positive" | "negative" | null>(null)

  function submitFeedback(rating: "positive" | "negative") {
    if (feedbackGiven) return
    setFeedbackGiven(rating)
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        conversationId: state.conversation_id,
        rating,
        tags: [],
      }),
    }).catch(() => {})
  }

  return (
    <div className={styles.sessionCloseWrap} role="region" aria-label="Samtalens afslutning">
      <div className={styles.sessionCloseInner}>
        <div className={styles.sessionCloseDot} aria-hidden="true" />

        <p className={styles.sessionCloseTitle}>
          {isClosingMode ? "Var samtalen nyttig?" : "Stille et øjeblik…"}
        </p>

        {summary && (
          <p className={styles.sessionCloseSummary}>{summary}</p>
        )}

        {/* ── Feedback-række ─────────────────────────────────────── */}
        <div className={styles.sessionCloseFeedbackRow}>
          {feedbackGiven ? (
            <span className={styles.sessionCloseFeedbackThanks}>Tak for din tilbagemelding.</span>
          ) : (
            <>
              <span className={styles.sessionCloseFeedbackLabel}>Var samtalen nyttig?</span>
              <button
                type="button"
                className={`${styles.sessionCloseFeedbackBtn} ${feedbackGiven === "positive" ? styles.sessionCloseFeedbackBtnActive : ""}`}
                onClick={() => submitFeedback("positive")}
                aria-label="Ja, nyttig"
                title="Ja"
              >
                👍
              </button>
              <button
                type="button"
                className={`${styles.sessionCloseFeedbackBtn} ${feedbackGiven === "negative" ? styles.sessionCloseFeedbackBtnActive : ""}`}
                onClick={() => submitFeedback("negative")}
                aria-label="Nej, ikke nyttig"
                title="Nej"
              >
                👎
              </button>
            </>
          )}
        </div>
        {/* ──────────────────────────────────────────────────────── */}

        <div className={styles.sessionCloseActions}>
          <button
            className={styles.sessionCloseBtn}
            onClick={onClose}
            type="button"
          >
            Luk
          </button>
          <button
            className={styles.sessionCloseContinueBtn}
            onClick={onContinue}
            type="button"
          >
            Fortsæt samtalen
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionClose
