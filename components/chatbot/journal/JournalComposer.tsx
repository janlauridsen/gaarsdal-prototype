"use client"

import type React from "react"
import { PaperAirplaneIcon } from "@heroicons/react/24/outline"

import styles from "../../Chatbot.module.css"
import { toDatetimeLocalValue } from "../utils"

export type JournalComposerProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  placeholder: string
  disabled: boolean
  loading: boolean

  journalProfile: "general" | "alcohol" | "strict"

  journalText: string
  setJournalText: (v: string) => void

  submitJournalEntry: (opts?: { bypassEval?: boolean }) => Promise<void>

  // alcohol top fields
  journalDrinks: string
  setJournalDrinks: (v: string) => void
  journalUrge: string
  setJournalUrge: (v: string) => void

  // strict field
  journalStrict: string
  setJournalStrict: (v: string) => void

  // details/eval
  journalTsLocal: string
  setJournalTsLocal: (v: string) => void
  setJournalDetailsOpen: (open: boolean) => void
  evaluateJournalDraft: () => void
  journalEvalLoading: boolean

  // tag summary (alcohol)
  journalMoodTag: string
  journalTriggerTag: string
  journalContextTag: string
  journalCopingTag: string
  journalAction: string
}

export function JournalComposer(props: JournalComposerProps) {
  const freeTextEnabled = !props.disabled

  return (
    <div className={styles.journalInputWrap}>
      {props.journalProfile === "alcohol" ? (
        <div className={styles.journalInputRowTop}>
          <label className={styles.journalField}>
            <span className={styles.journalFieldLabel}>Drinks</span>
            <input
              className={styles.journalFieldInput}
              inputMode="numeric"
              value={props.journalDrinks}
              onChange={(e) => props.setJournalDrinks(e.target.value)}
              placeholder="0"
              disabled={!freeTextEnabled}
            />
          </label>
          <label className={styles.journalField}>
            <span className={styles.journalFieldLabel}>Urge (0–10)</span>
            <input
              className={styles.journalFieldInput}
              inputMode="numeric"
              value={props.journalUrge}
              onChange={(e) => props.setJournalUrge(e.target.value)}
              placeholder=""
              disabled={!freeTextEnabled}
            />
          </label>
        </div>
      ) : null}

      {props.journalProfile === "alcohol" ? (
        <div className={styles.journalMetaRow}>
          <button
            className={styles.journalToggleBtn}
            type="button"
            onClick={() => {
              if (!props.journalTsLocal) props.setJournalTsLocal(toDatetimeLocalValue(new Date()))
              props.setJournalDetailsOpen(true)
            }}
            disabled={!freeTextEnabled}
          >
            Detaljer
          </button>

          <button
            className={styles.journalToggleBtn}
            type="button"
            onClick={() => props.evaluateJournalDraft()}
            disabled={!freeTextEnabled || props.journalEvalLoading}
            title="Få forslag"
          >
            Få forslag
          </button>
        </div>
      ) : null}

      {props.journalProfile === "alcohol" ? (
        <div className={styles.journalTagSummary}>
          {(() => {
            const chips = [
              props.journalMoodTag ? `Sind: ${props.journalMoodTag}` : "",
              props.journalTriggerTag ? `Trigger: ${props.journalTriggerTag}` : "",
              props.journalContextTag ? `Kontekst: ${props.journalContextTag}` : "",
              props.journalCopingTag ? `Coping: ${props.journalCopingTag}` : "",
              props.journalAction ? `Handling: ${props.journalAction}` : "",
            ].filter(Boolean)

            if (!chips.length) return null
            return (
              <div className={styles.journalTagSummaryRow}>
                {chips.map((c) => (
                  <span key={c} className={styles.journalTagPill}>
                    {c}
                  </span>
                ))}
              </div>
            )
          })()}
        </div>
      ) : null}

      {props.journalProfile === "strict" ? (
        <div className={styles.journalInputRowTop}>
          <label className={styles.journalField}>
            <span className={styles.journalFieldLabel}>Skala (0–10)</span>
            <input
              className={styles.journalFieldInput}
              inputMode="numeric"
              value={props.journalStrict}
              onChange={(e) => props.setJournalStrict(e.target.value)}
              placeholder=""
              disabled={!freeTextEnabled}
            />
          </label>
        </div>
      ) : null}

      <div className={styles.inputRow}>
        <textarea
          ref={props.textareaRef}
          className={styles.textarea}
          value={props.journalText}
          onChange={(e) => props.setJournalText(e.target.value)}
          placeholder={props.placeholder}
          rows={2}
          disabled={!freeTextEnabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              props.submitJournalEntry()
            }
          }}
        />
        <button
          className={styles.sendBtn}
          onClick={() => {
            props.submitJournalEntry()
          }}
          title="Gem"
          aria-label="Gem"
          disabled={!freeTextEnabled || props.loading}
        >
          <PaperAirplaneIcon className={styles.sendBtnIcon} />
        </button>
      </div>
    </div>
  )
}
