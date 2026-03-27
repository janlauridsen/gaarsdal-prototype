"use client"

import { useState, useRef, useEffect } from "react"
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
import { CHATBOT_DISCLOSURE } from "./constants"
import { derivePhase, type ConversationPhase } from "./utils"

function PhaseIndicator({ phase, label }: { phase: ConversationPhase; label: string }) {
  return (
    <div className={styles.phaseIndicator} title={label} aria-label={`Samtalefase: ${label}`}>
      {([1, 2, 3] as ConversationPhase[]).map((p) => (
        <span
          key={p}
          className={`${styles.phaseDot} ${p <= phase ? styles.phaseDotActive : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className={styles.phaseLabel}>{label}</span>
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  function closeMenu() { setMenuOpen(false) }

  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        {/* Venstre: titel + fase */}
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
          {props.state?.active_node === "GEN_HYPNO" && (
            {(() => { const p = derivePhase(props.state?.meta ?? null); return <PhaseIndicator phase={p.phase} label={p.label} /> })()}
          )}
        </div>

        {/* Højre: hamburger + expand + luk */}
        <div className={styles.headerRight}>
          <div className={styles.hamburgerWrap} ref={menuRef}>
            <button
              className={`${styles.iconBtn} ${menuOpen ? styles.iconBtnActive : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              title="Menu"
            >
              <span className={styles.hamburgerIcon} aria-hidden="true">
                <span /><span /><span />
              </span>
            </button>

            {menuOpen && (
              <div className={styles.hamburgerPanel} role="menu">
                {/* Tråde */}
                <button
                  className={styles.hamburgerItem}
                  role="menuitem"
                  disabled={props.loading || !props.state}
                  onClick={() => {
                    closeMenu()
                    props.setThreadsOpen(true)
                  }}
                >
                  <ChatBubbleOvalLeftEllipsisIcon className={styles.hamburgerItemSvg} />
                  Tråde
                </button>

                {/* Ny samtale */}
                <button
                  className={styles.hamburgerItem}
                  role="menuitem"
                  disabled={props.loading}
                  onClick={() => {
                    closeMenu()
                    props.dispatch({ type: "THREAD_CREATE", mode: "normal" }, { silentUser: true })
                  }}
                >
                  <PlusIcon className={styles.hamburgerItemSvg} />
                  Ny samtale
                </button>

                <div className={styles.hamburgerDivider} />

                {/* Om chatbotten */}
                <button
                  className={styles.hamburgerItem}
                  role="menuitem"
                  onClick={() => { setInfoOpen((v) => !v); closeMenu() }}
                >
                  <span className={styles.hamburgerItemIcon} aria-hidden="true">ⓘ</span>
                  Om chatbotten
                </button>

                {/* Start forfra */}
                <button
                  className={styles.hamburgerItem}
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    props.dispatch({ type: "THREAD_CREATE", mode: "normal" }, { silentUser: true })
                  }}
                >
                  <span className={styles.hamburgerItemIcon} aria-hidden="true">↺</span>
                  Start forfra
                </button>
              </div>
            )}
          </div>

          <button
            className={styles.iconBtn}
            onClick={props.toggleExpanded}
            title={props.expanded ? "Minimer" : "Maksimer"}
            aria-label={props.expanded ? "Minimer" : "Maksimer"}
          >
            {props.expanded
              ? <ArrowsPointingInIcon className={styles.icon} />
              : <ArrowsPointingOutIcon className={styles.icon} />}
          </button>

          <button className={styles.iconBtn} onClick={props.closeChat} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>
      </div>

      {/* Info-panel */}
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

      {/* ThreadDrawer */}
      <ThreadDrawer
        open={props.threadsOpen}
        threadTabs={props.threadTabs}
        activeConversationId={props.activeConversationId}
        disabled={props.loading || !props.state}
        dispatch={props.dispatch}
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
