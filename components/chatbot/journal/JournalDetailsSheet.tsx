"use client"

import type React from "react"
import type { KeyboardEvent } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

import styles from "../../Chatbot.module.css"

type Props = {
  open: boolean
  disabled: boolean
  sheetRef: React.RefObject<HTMLDivElement>
  onRequestClose: () => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void

  tsLocal: string
  setTsLocal: (v: string) => void

  moodTag: string
  setMoodTag: (v: string) => void
  mood: string
  setMood: (v: string) => void

  triggerTag: string
  setTriggerTag: (v: string) => void

  contextTag: string
  setContextTag: (v: string) => void

  copingTag: string
  setCopingTag: (v: string) => void

  action: string
  setAction: (v: string) => void

  cravingPeak: string
  setCravingPeak: (v: string) => void

  cravingDuration: string
  setCravingDuration: (v: string) => void
}

export default function JournalDetailsSheet(props: Props) {
  const {
    open,
    disabled,
    sheetRef,
    onRequestClose,
    onKeyDown,
    tsLocal,
    setTsLocal,
    moodTag,
    setMoodTag,
    mood,
    setMood,
    triggerTag,
    setTriggerTag,
    contextTag,
    setContextTag,
    copingTag,
    setCopingTag,
    action,
    setAction,
    cravingPeak,
    setCravingPeak,
    cravingDuration,
    setCravingDuration,
  } = props

  if (!open) return null

  return (
    <div
      className={styles.sheetOverlay}
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
      onClick={onRequestClose}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <div className={styles.sheetTitle}>Detaljer</div>
          <button className={styles.iconBtn} onClick={onRequestClose} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <div className={styles.sheetBody} ref={sheetRef} tabIndex={-1}>
          <label className={styles.modalField}>
            <span className={styles.modalLabel}>Dato/tid</span>
            <input
              className={styles.modalInput}
              type="datetime-local"
              value={tsLocal}
              onChange={(e) => setTsLocal(e.target.value)}
              disabled={disabled}
            />
          </label>

          <div className={styles.journalQuickBlock}>
            <details className={styles.journalSelect}>
              <summary className={styles.journalSelectSummary}>
                <span className={styles.journalSelectSummaryLabel}>Sindstilstand</span>
                <span className={styles.journalSelectSummaryValue}>{moodTag || "Vælg"}</span>
              </summary>
              <div className={styles.journalSelectBody}>
                <div className={styles.journalQuickRow}>
                  {["rolig", "stresset", "trist", "rastløs", "glad"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.journalQuickChip} ${moodTag === v ? styles.journalQuickChipActive : ""}`}
                      onClick={() => setMoodTag(moodTag === v ? "" : v)}
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.journalSelect}>
              <summary className={styles.journalSelectSummary}>
                <span className={styles.journalSelectSummaryLabel}>Trigger</span>
                <span className={styles.journalSelectSummaryValue}>{triggerTag || "Vælg"}</span>
              </summary>
              <div className={styles.journalSelectBody}>
                <div className={styles.journalQuickRow}>
                  {["stress", "socialt", "konflikt", "kedsomhed", "belønning"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.journalQuickChip} ${triggerTag === v ? styles.journalQuickChipActive : ""}`}
                      onClick={() => setTriggerTag(triggerTag === v ? "" : v)}
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.journalSelect}>
              <summary className={styles.journalSelectSummary}>
                <span className={styles.journalSelectSummaryLabel}>Kontekst</span>
                <span className={styles.journalSelectSummaryValue}>{contextTag || "Vælg"}</span>
              </summary>
              <div className={styles.journalSelectBody}>
                <div className={styles.journalQuickRow}>
                  {["alene", "sammen", "hjemme", "ude", "aften"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.journalQuickChip} ${contextTag === v ? styles.journalQuickChipActive : ""}`}
                      onClick={() => setContextTag(contextTag === v ? "" : v)}
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.journalSelect}>
              <summary className={styles.journalSelectSummary}>
                <span className={styles.journalSelectSummaryLabel}>Coping</span>
                <span className={styles.journalSelectSummaryValue}>{copingTag || "Vælg"}</span>
              </summary>
              <div className={styles.journalSelectBody}>
                <div className={styles.journalQuickRow}>
                  {["gåtur", "vand", "vejrtrækning", "ring", "distraktion"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.journalQuickChip} ${copingTag === v ? styles.journalQuickChipActive : ""}`}
                      onClick={() => setCopingTag(copingTag === v ? "" : v)}
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.journalSelect}>
              <summary className={styles.journalSelectSummary}>
                <span className={styles.journalSelectSummaryLabel}>Handling</span>
                <span className={styles.journalSelectSummaryValue}>{action || "Vælg"}</span>
              </summary>
              <div className={styles.journalSelectBody}>
                <div className={styles.journalQuickRow}>
                  {["drak", "undlod", "skar ned"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`${styles.journalQuickChip} ${action === v ? styles.journalQuickChipActive : ""}`}
                      onClick={() => setAction(action === v ? "" : v)}
                      disabled={disabled}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </details>

            <div className={styles.journalAdvancedGrid}>
              <label className={styles.journalField}>
                <span className={styles.journalFieldLabel}>Sind (0–10)</span>
                <input
                  className={styles.journalFieldInput}
                  inputMode="numeric"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder=""
                  disabled={disabled}
                />
              </label>

              <label className={styles.journalField}>
                <span className={styles.journalFieldLabel}>Craving peak (0–10)</span>
                <input
                  className={styles.journalFieldInput}
                  inputMode="numeric"
                  value={cravingPeak}
                  onChange={(e) => setCravingPeak(e.target.value)}
                  placeholder=""
                  disabled={disabled}
                />
              </label>

              <label className={styles.journalField}>
                <span className={styles.journalFieldLabel}>Craving varighed (min)</span>
                <input
                  className={styles.journalFieldInput}
                  inputMode="numeric"
                  value={cravingDuration}
                  onChange={(e) => setCravingDuration(e.target.value)}
                  placeholder=""
                  disabled={disabled}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
