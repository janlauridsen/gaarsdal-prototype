"use client"

import { useState } from "react"
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/outline"

import styles from "../Chatbot.module.css"

import type { InputSignal, ThreadTab } from "./types"
import { formatThreadPreview } from "./threadPreview"
import { trimDuplicateTitle } from "./utils"

function hasRealContent(t: ThreadTab): boolean {
  if (t.preview && t.preview.trim().length > 0) return true
  const title = (t.title || "").trim().toLowerCase()
  return title.length > 0 && title !== "ny samtale" && title !== "parentesespor"
}

type Props = {
  open: boolean
  threadTabs: ThreadTab[]
  activeConversationId: string | null
  disabled: boolean
  onClose: () => void
  onSwitchThread: (conversationId: string) => void
  dispatch: (input: InputSignal, opts?: { silentUser?: boolean }) => Promise<boolean> | boolean
}

export default function ThreadDrawer({
  open,
  threadTabs,
  activeConversationId,
  disabled,
  onClose,
  onSwitchThread,
  dispatch,
}: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!open) return null

  const sorted = threadTabs
    .slice()
    .filter(hasRealContent)
    .sort((a, b) => {
      const ta = Date.parse(a.updated_at || "") || 0
      const tb = Date.parse(b.updated_at || "") || 0
      return tb - ta
    })

  function handleDelete(conversationId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (confirmId === conversationId) {
      // Bekræftet — arkiver
      dispatch(
        { type: "THREAD_ARCHIVE", conversation_id: conversationId } as any,
        { silentUser: true }
      )
      setConfirmId(null)
      if (conversationId === activeConversationId) onClose()
    } else {
      // Første klik — bed om bekræftelse
      setConfirmId(conversationId)
    }
  }

  return (
    <div className={styles.threadsOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.threadsHeader} onClick={(e) => e.stopPropagation()}>
        <div className={styles.threadsTitle}>Tråde</div>
        <button className={styles.iconBtn} onClick={onClose} title="Luk" aria-label="Luk">
          <XMarkIcon className={styles.icon} />
        </button>
      </div>

      <div className={styles.threadsBody} onClick={(e) => e.stopPropagation()}>
        {sorted.length === 0 ? (
          <div className={styles.threadsHint}>Ingen tråde endnu.</div>
        ) : (
          <div className={styles.threadsList}>
            {sorted.map((t) => {
              const isActive = !!activeConversationId && t.conversation_id === activeConversationId
              const label = (t.title || "").trim() || trimDuplicateTitle(t.preview || "Samtale")
              const isConfirming = confirmId === t.conversation_id

              return (
                <div
                  key={t.conversation_id}
                  className={`${styles.threadItemWrap} ${isActive ? styles.threadItemWrapActive : ""}`}
                  onMouseLeave={() => { if (isConfirming) setConfirmId(null) }}
                >
                  {/* Klikbar del */}
                  <button
                    className={`${styles.threadItemBody} ${isActive ? styles.threadItemActive : ""}`}
                    onClick={() => {
                      if (!isActive) onSwitchThread(t.conversation_id)
                      onClose()
                    }}
                    disabled={disabled}
                    title={t.preview || t.title || ""}
                  >
                    <div className={styles.threadItemTop}>
                      <div className={styles.threadItemTitle}>{label}</div>
                    </div>
                    {t.preview
                      ? <div className={styles.threadItemPreview}>{formatThreadPreview(t)}</div>
                      : null}
                  </button>

                  {/* Slet-knap */}
                  <button
                    className={`${styles.threadDeleteBtn} ${isConfirming ? styles.threadDeleteBtnConfirm : ""}`}
                    onClick={(e) => handleDelete(t.conversation_id, e)}
                    disabled={disabled}
                    title={isConfirming ? "Bekræft sletning" : "Slet tråd"}
                    aria-label={isConfirming ? "Bekræft sletning" : "Slet tråd"}
                  >
                    {isConfirming
                      ? <span className={styles.threadDeleteConfirmLabel}>Slet?</span>
                      : <TrashIcon className={styles.threadDeleteIcon} />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
