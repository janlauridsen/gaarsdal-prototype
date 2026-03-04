"use client"

import { XMarkIcon } from "@heroicons/react/24/outline"

import styles from "../../Chatbot.module.css"

type Props = {
  open: boolean
  loading: boolean
  error: string | null
  summary: string
  questions: string[]
  onClose: () => void
  onBackToEdit: () => void
  onSave: () => Promise<void>
}

export default function JournalEvalModal(props: Props) {
  const { open, loading, error, summary, questions, onClose, onBackToEdit, onSave } = props
  if (!open) return null

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalWide}`.trim()} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Evaluer input</div>
          <button className={styles.iconBtn} onClick={onClose} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        <div className={`${styles.modalBody} ${styles.modalBodyScroll}`.trim()}>
          {loading ? (
            <div className={styles.modalText}>Arbejder…</div>
          ) : error ? (
            <div className={styles.modalText}>Kunne ikke evaluere: {error}</div>
          ) : (
            <>
              {summary ? <div className={styles.modalText}>{summary}</div> : null}
              {questions.length ? (
                <div className={styles.modalText}>
                  Overvej evt.:
                  <ul>
                    {questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={styles.modalText}>Ingen oplagte opfølgende spørgsmål.</div>
              )}
              <div className={styles.modalText}>
                Brug spørgsmålene som inspiration. Luk og uddybe notatet – eller gem som det er.
              </div>
            </>
          )}

          <div className={styles.modalActions}>
            <button className={styles.secondaryBtn} onClick={onBackToEdit}>
              Tilbage og uddyb
            </button>
            <button
              className={styles.primaryBtn}
              onClick={onSave}
              disabled={loading}
            >
              Gem
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
