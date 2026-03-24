"use client"

import { useState } from "react"
import type { ConversationState } from "./types"
import styles from "../Chatbot.module.css"

/**
 * Læser en meta-værdi sikkert fra ConversationState.meta.
 */
function readMeta(state: ConversationState, key: string): unknown {
  const entry = state.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
  return entry
}

/**
 * Afgør om spejlet skal vises på dette turn-nummer.
 *
 * Logik:
 * - Kræver minimum 4 AI-svar (hvert 4. turn: 4, 8, 12...)
 * - Kræver at mindst ét topic er registreret
 * - Kræver aktiv GEN_HYPNO dialog (ikke lobby, ikke closing)
 *
 * Dagbogslogik: spejlet er ikke analyse — det er en passiv observation
 * der giver brugeren et ekko af deres eget fokus. "Du har berørt søvn"
 * er ikke en konklusion, det er et spejl.
 */
export function shouldShowMirror(state: ConversationState): boolean {
  if (state.active_node !== "GEN_HYPNO") return false
  if (state.status !== "active") return false

  const stage = readMeta(state, "dialog.stage")
  if (stage === "close") return false

  const turnCount = readMeta(state, "gen_hypno.assistant_turn_count")
  const turns = typeof turnCount === "number" ? turnCount : 0

  if (turns < 4) return false
  if (turns % 4 !== 0) return false

  const topic = readMeta(state, "gen_hypno.last_topic")
  return typeof topic === "string" && topic.trim().length > 0
}

/**
 * Bygger observationsteksten.
 * Bevidst holdt i observationsform — ingen fortolkning, ingen konklusion.
 */
function buildMirrorText(state: ConversationState): string | null {
  const topic = readMeta(state, "gen_hypno.last_topic")
  const tags = readMeta(state, "gen_hypno.topic_tags")
  const turnCount = readMeta(state, "gen_hypno.assistant_turn_count")
  const turns = typeof turnCount === "number" ? turnCount : 0

  if (typeof topic !== "string" || !topic.trim()) return null

  const t = topic.trim()

  // Brug topic_tags hvis der er flere — det giver en rigere observation
  const tagList = Array.isArray(tags)
    ? tags.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 2)
    : []

  if (tagList.length >= 2 && turns >= 8) {
    return `Du har i denne samtale kredset om ${tagList[0]} og ${tagList[1]}.`
  }

  if (turns >= 8) {
    return `Du har vendt tilbage til ${t} flere gange i denne samtale.`
  }

  return `Du har berørt ${t} i denne samtale.`
}

export type MirrorInsightProps = {
  state: ConversationState
}

export function MirrorInsight({ state }: MirrorInsightProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const text = buildMirrorText(state)
  if (!text) return null

  return (
    <div className={styles.mirrorWrap} role="note" aria-label="Observation fra samtalen">
      <div className={styles.mirrorInner}>
        <span className={styles.mirrorIcon} aria-hidden="true">◈</span>
        <span className={styles.mirrorText}>{text}</span>
        <button
          className={styles.mirrorDismiss}
          onClick={() => setDismissed(true)}
          type="button"
          aria-label="Afvis observation"
          title="Afvis"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default MirrorInsight
