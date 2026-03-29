"use client"

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
 * der giver brugeren et ekko af deres eget fokus.
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
 * Holdt i første person og observationsform — ingen fortolkning, ingen konklusion.
 */
function buildMirrorText(state: ConversationState): string | null {
  const topic = readMeta(state, "gen_hypno.last_topic")
  const tags = readMeta(state, "gen_hypno.topic_tags")
  const summary = readMeta(state, "gen_hypno.problem_summary")
  const turnCount = readMeta(state, "gen_hypno.assistant_turn_count")
  const turns = typeof turnCount === "number" ? turnCount : 0

  if (typeof topic !== "string" || !topic.trim()) return null

  const t = topic.trim()
  const s = typeof summary === "string" && summary.trim() && summary.trim() !== t
    ? summary.trim()
    : null

  const tagList = Array.isArray(tags)
    ? tags.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 2)
    : []

  // Turn 8+: to tags → kredser om X og Y + summary
  if (tagList.length >= 2 && turns >= 8) {
    return s
      ? `Du har i denne samtale kredset om ${tagList[0]} og ${tagList[1]} — særligt ${s}.`
      : `Du har i denne samtale kredset om ${tagList[0]} og ${tagList[1]}.`
  }

  // Turn 8+: ét tag + summary
  if (turns >= 8) {
    return s
      ? `Du har vendt tilbage til ${t} flere gange i denne samtale — med fokus på ${s}.`
      : `Du har vendt tilbage til ${t} flere gange i denne samtale.`
  }

  // Turn 4-7: basistekst + summary hvis tilgængelig
  return s
    ? `Du har berørt ${t} i denne samtale — nærmere bestemt ${s}.`
    : `Du har berørt ${t} i denne samtale.`
}

export type MirrorInsightProps = {
  state: ConversationState
}

/**
 * Vises som en kort, neutral linje fra chatbotten — ikke en chip der
 * kan afvises. Det er en observation i samtalens flow, ikke en notifikation.
 *
 * UX-princip: ingen × fordi der ikke er noget at "afvise" — det er bare
 * et ekko. Brugeren kan ignorere det og fortsætte.
 */
export function MirrorInsight({ state }: MirrorInsightProps) {
  const text = buildMirrorText(state)
  if (!text) return null

  return (
    <div className={styles.mirrorWrap} role="note">
      <span className={styles.mirrorLabel}>Chatbotten bemærker:</span>
      <span className={styles.mirrorText}>{text}</span>
    </div>
  )
}

export default MirrorInsight
