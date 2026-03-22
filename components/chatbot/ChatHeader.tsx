"use client"

import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import styles from "../Chatbot.module.css"

import type { ConversationState, InputSignal, ThreadTab } from "./types"
import ThreadDrawer from "./ThreadDrawer"

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
  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <img
              src="/gaarsdal-logo-2026-02.png"
              alt="Gaarsdal Hypnoterapi"
              className={styles.headerLogo}
            />
            <span
              className={`${styles.headerHeart} ${props.loading ? styles.headerHeartActive : ""}`}
              aria-label={props.loading ? "Arbejder" : ""}
              title={props.loading ? "Arbejder…" : ""}
            >
              ♥
            </span>
          </div>
          <div className={styles.node}>{props.activeNodeLabel}</div>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.iconBtn}
            onClick={props.toggleExpanded}
            title={props.expanded ? "Minimer" : "Maksimer"}
            aria-label={props.expanded ? "Minimer" : "Maksimer"}
          >
            {props.expanded ? <ArrowsPointingInIcon className={styles.icon} /> : <ArrowsPointingOutIcon className={styles.icon} />}
          </button>

          <button className={styles.iconBtn} onClick={props.closeChat} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>
      </div>

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
            onClick={() => props.dispatch({ type: "THREAD_CREATE", mode: "normal" }, { silentUser: true })}
            disabled={props.loading}
            title="Ny tråd"
            aria-label="Ny tråd"
          >
            <PlusIcon className={styles.actionBtnIcon} />
            <span className={styles.actionBtnLabel}>Ny</span>
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
          props.dispatch({ type: "THREAD_SWITCH", conversation_id: conversationId }, { silentUser: true })
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
