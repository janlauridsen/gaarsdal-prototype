"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"

import styles from "../Chatbot.module.css"

import type { ThreadTab } from "./types"
import { formatThreadPreview } from "./threadPreview"
import { trimDuplicateTitle } from "./utils"

// En tråd har reelt indhold hvis den har en preview (brugeren har skrevet noget)
// eller en ikke-generisk titel der er genereret af AI.
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
}

export default function ThreadDrawer({
  open,
  threadTabs,
  activeConversationId,
  disabled,
  onClose,
  onSwitchThread,
}: Props) {
  if (!open) return null

  return (
    <div className={styles.threadsOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.threadsHeader} onClick={(e) => e.stopPropagation()}>
        <div className={styles.threadsTitle}>Tråde</div>
        <button className={styles.iconBtn} onClick={onClose} title="Luk" aria-label="Luk">
          <XMarkIcon className={styles.icon} />
        </button>
      </div>

      <div className={styles.threadsBody} onClick={(e) => e.stopPropagation()}>
        {threadTabs.length === 0 ? (
          <div className={styles.threadsHint}>Ingen tråde endnu.</div>
        ) : (
          <div className={styles.threadsList}>
            {threadTabs
              .slice()
              .filter(hasRealContent)
              .sort((a, b) => {
                const ta = Date.parse(a.updated_at || "") || 0
                const tb = Date.parse(b.updated_at || "") || 0
                return tb - ta
              })
              .map((t) => {
                const isActive = !!activeConversationId && t.conversation_id === activeConversationId
                const label = (t.title || "").trim() || trimDuplicateTitle(t.preview || "Samtale")

                return (
                  <button
                    key={t.conversation_id}
                    className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ""}`}
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
                    {t.preview ? <div className={styles.threadItemPreview}>{formatThreadPreview(t)}</div> : null}
                  </button>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
