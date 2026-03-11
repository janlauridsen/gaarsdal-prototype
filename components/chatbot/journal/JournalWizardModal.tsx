"use client"

import type React from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"

import styles from "../../Chatbot.module.css"

export type JournalProfile = "alcohol" | "general" | "strict"

type Props = {
  open: boolean
  step: 1 | 2
  profile: JournalProfile | null
  title: string
  problem: string
  goal: string

  canCreate: boolean

  setStep: (v: 1 | 2) => void
  setProfile: (v: JournalProfile | null) => void
  setTitle: (v: string) => void
  setProblem: (v: string) => void
  setGoal: (v: string) => void

  onClose: () => void
  onResetDraft: () => void
  onCreate: (args: { profile: JournalProfile; title: string; problem: string; goal: string }) => Promise<void>
}

export default function JournalWizardModal(props: Props) {
  const {
    open,
    canCreate,
    step,
    profile,
    title,
    problem,
    goal,
    setStep,
    setProfile,
    setTitle,
    setProblem,
    setGoal,
    onClose,
    onResetDraft,
    onCreate,
  } = props

  if (!open) return null

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>Start dagbog</div>
          <button className={styles.iconBtn} onClick={onClose} title="Luk" aria-label="Luk">
            <XMarkIcon className={styles.icon} />
          </button>
        </div>

        {!canCreate ? (
          <div className={styles.modalBody}>
            <div className={styles.modalText}>Du har allerede 5 aktive dagbøger.</div>
            <div className={styles.modalActions}>
              <button className={styles.primaryBtn} onClick={onClose}>
                Ok
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.modalBody}>
            {step === 1 && (
              <>
                <div className={styles.modalText}>Vælg type</div>
                <div className={styles.optionGrid}>
                  <button
                    className={styles.optionBtn}
                    onClick={() => {
                      setProfile("alcohol")
                      setStep(2)
                    }}
                  >
                    <div className={styles.optionTitle}>Alkohol</div>
                    <div className={styles.optionHint}>Fritekst + drinks + urge.</div>
                  </button>
                  <button
                    className={styles.optionBtn}
                    onClick={() => {
                      setProfile("general")
                      setStep(2)
                    }}
                  >
                    <div className={styles.optionTitle}>Generel</div>
                    <div className={styles.optionHint}>Kun fritekst.</div>
                  </button>
                  <button
                    className={styles.optionBtn}
                    onClick={() => {
                      setProfile("strict")
                      setStep(2)
                    }}
                  >
                    <div className={styles.optionTitle}>Streng</div>
                    <div className={styles.optionHint}>Fritekst + én skala.</div>
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.modalText}>Titel og startdefinition</div>
                <label className={styles.modalField}>
                  <span className={styles.modalLabel}>Titel (emne)</span>
                  <input
                    className={styles.modalInput}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Fx: Alkohol – efter arbejde"
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.modalLabel}>Problem / kontekst</span>
                  <textarea
                    className={styles.modalTextarea}
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={3}
                    placeholder="1–3 linjer"
                  />
                </label>
                <label className={styles.modalField}>
                  <span className={styles.modalLabel}>Mål / intention</span>
                  <textarea
                    className={styles.modalTextarea}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={2}
                    placeholder="1–2 linjer"
                  />
                </label>
                <div className={styles.modalActions}>
                  <button className={styles.secondaryBtn} onClick={onResetDraft}>
                    Tilbage
                  </button>
                  <button
                    className={styles.primaryBtn}
                    disabled={!profile || !title.trim()}
                    onClick={async () => {
                      if (!profile) return
                      await onCreate({ profile, title: title.trim(), problem: problem.trim(), goal: goal.trim() })
                    }}
                  >
                    Opret dagbog
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
