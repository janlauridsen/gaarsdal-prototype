"use client"

import type { ConversationState } from "./types"
import styles from "../Chatbot.module.css"

/**
 * Læser en meta-værdi sikkert fra ConversationState.meta.
 */
function readMeta(state: ConversationState, key: string): unknown {
  const entry = state.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) {
    return (entry as any).value
  }
  return entry
}

/**
 * Bygger en kort, menneskelig opsummering af samtalen baseret på
 * hvad systemet allerede ved fra meta-laget.
 *
 * Dagbogslogik: formuleringen er bevidst holdt i første person og
 * fremadskuende — den skal føles som en afslutning i en dagbog,
 * ikke som en systembesked.
 */
function buildClosingSummary(state: ConversationState): string | null {
  const topic = readMeta(state, "gen_hypno.last_topic")
  const problemSummary = readMeta(state, "gen_hypno.problem_summary")
  const turnCount = readMeta(state, "gen_hypno.assistant_turn_count")
  const stage = readMeta(state, "dialog.stage")

  if (typeof turnCount !== "number" || turnCount < 2) return null
  if (typeof topic !== "string" || !topic.trim()) return null

  const t = topic.trim()

  // Brug problem_summary hvis tilgængeligt — det er mere specifikt
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

  return (
    <div className={styles.sessionCloseWrap} role="region" aria-label="Samtalens afslutning">
      <div className={styles.sessionCloseInner}>
        {/* Lille prik der signalerer afsluttet session */}
        <div className={styles.sessionCloseDot} aria-hidden="true" />

        <p className={styles.sessionCloseTitle}>
          {isClosingMode ? "Samtalen er ved at slutte" : "Stille et øjeblik…"}
        </p>

        {summary && (
          <p className={styles.sessionCloseSummary}>{summary}</p>
        )}

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
