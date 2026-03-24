"use client"

import { useState } from "react"
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  InformationCircleIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import styles from "../Chatbot.module.css"

import type { ConversationState, InputSignal, ThreadTab } from "./types"
import ThreadDrawer from "./ThreadDrawer"
import { CHATBOT_DISCLOSURE } from "./constants"
import { deriveConversationPhase, PHASE_LABELS, type ConversationPhase } from "./utils"

/**
 * Tre diskrete dots der viser samtalens fase.
 * Bevidst subtil — må aldrig dominere headeren.
 */
function PhaseIndicator({ phase }: { phase: ConversationPhase }) {
  return (
    <div className={styles.phaseIndicator} title={PHASE_LABELS[phase]} aria-label={`Samtalefase: ${PHASE_LABELS[phase]}`}>
      {([1, 2, 3] as ConversationPhase[]).map((p) => (
        <span
          key={p}
          className={`${styles.phaseDot} ${p <= phase ? styles.phaseDotActive : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className={styles.phaseLabel}>{PHASE_LABELS[phase]}</span>
    </div>
  )
}

export type ChatHeaderProps = {
  loading: boolean
  expanded: boolean
  activeNodeLabel: string
  toggleExpanded: () => void
  closeChat: () => void
  threadsOpen: boolean
  setThreadsOpen: (open: boolean) => void
  threadTabs: ThreadTab[]
  activeConversationId: string | null
  state: ConversationState | null
  dispatch: (input: InputSignal, opts?: { silentUser?: boolean }) => Promise<boolean> | boolean
  focusInput: () => void
  headerNavHint: string | null
}

export function ChatHeader(props: ChatHeaderProps) {
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <div className={styles.title}>Gaarsdal</div>
            <span
              className={`${styles.headerHeart} ${props.loading ? styles.headerHeartActive : ""}`}
              aria-label={props.loading ? "Arbejder" : ""}
              title={props.loading ? "Arbejder…" : ""}
            >
              ♥
            </span>
          </div>
          <div className={styles.node}>{props.activeNodeLabel}</div>
          {/* Fase-indikator: vises kun når der er en aktiv dialog-samtale */}
          {props.state?.active_node === "GEN_HYPNO" && (
            <PhaseIndicator phase={deriveConversationPhase(props.state?.meta)} />
          )}
        </div>

        <div className={styles.headerRight}>
          {/* Info-knap: AI-identitet og datapolitik */}
          <button
            className={`${styles.iconBtn} ${infoOpen ? styles.iconBtnActive : ""}`}
            onClick={() => setInfoOpen((v) => !v)}
            title="Om chatbotten"
            aria-label="Om chatbotten"
            aria-expanded={infoOpen}
          >
            <InformationCircleIcon className={styles.icon} />
          </button>

          <button
            className={styles.iconBtn}
            onClick={props.toggleExpanded}
            title={props.expanded ? "Minimer" : "Maksimer"}
            aria-label={props.expanded ? "Minimer" : "Maksimer"}
          >
            {props.expanded ? (
              <ArrowsPointingInIcon className={styles.icon} />
            ) : (
              <ArrowsPointingOutIcon className={styles.icon} />
            )}
          </button>

          <button className={styles.iconBtn} onClick={props.closeChat} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>
      </div>

      {/* Info-panel: vises under headerRow */}
      {infoOpen && (
        <div className={styles.infoPanel} role="region" aria-label="Om chatbotten">
          <p className={styles.infoPanelLine}>
            <span className={styles.infoPanelDot} aria-hidden="true">◆</span>
            {CHATBOT_DISCLOSURE.identity}
          </p>
          <p className={styles.infoPanelLine}>
            <span className={styles.infoPanelDot} aria-hidden="true">◆</span>
            {CHATBOT_DISCLOSURE.memory}
          </p>
          <p className={styles.infoPanelLine}>
            <span className={styles.infoPanelDot} aria-hidden="true">◆</span>
            {CHATBOT_DISCLOSURE.privacy}
          </p>
        </div>
      )}

      <div className={styles.actionsRow} aria-label="Tråde og handlinger">
        <button
          className={styles.threadBtn}
          onClick={() => props.setThreadsOpen(true)}
          disabled={props.loading || !props.state}
          title="Tråde"
          aria-label="Tråde"
        >
          <ChatBubbleOvalLeftEllipsisIcon className={styles.threadBtnIcon} />
          <span className={styles.threadBtnLabel}>Tråde</span>
        </button>

        <div className={styles.actionsRight}>
          <button
            className={styles.actionBtn}
            onClick={() =>
              props.dispatch({ type: "THREAD_CREATE", mode: "normal" }, { silentUser: true })
            }
            disabled={props.loading}
            title="Ny tråd"
            aria-label="Ny tråd"
          >
            <PlusIcon className={styles.actionBtnIcon} />
            <span className={styles.actionBtnLabel}>Ny samtale</span>
          </button>
        </div>
      </div>

      <ThreadDrawer
        open={props.threadsOpen}
        threadTabs={props.threadTabs}
        activeConversationId={props.activeConversationId}
        disabled={props.loading || !props.state}
        onClose={() => {
          props.setThreadsOpen(false)
          props.focusInput()
        }}
        onSwitchThread={(conversationId) => {
          props.dispatch(
            { type: "THREAD_SWITCH", conversation_id: conversationId },
            { silentUser: true }
          )
        }}
      />

      {props.headerNavHint && (
        <div className={styles.navHint}>
          <span className={styles.navHintPulse}>{props.headerNavHint}</span>
        </div>
      )}
    </div>
  )
}
