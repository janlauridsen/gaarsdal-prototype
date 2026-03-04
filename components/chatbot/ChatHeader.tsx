"use client"

import type React from "react"
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import styles from "../Chatbot.module.css"

import type { ConversationState, InputSignal, ThreadTab } from "./types"
import JournalDetailsSheet from "./journal/JournalDetailsSheet"
import JournalEvalModal from "./journal/JournalEvalModal"
import JournalWizardModal from "./journal/JournalWizardModal"
import ThreadDrawer from "./ThreadDrawer"

export type ChatHeaderProps = {
  loading: boolean
  expanded: boolean
  activeNodeLabel: string
  openJournalWizard: () => void
  toggleExpanded: () => void
  closeChat: () => void

  // Thread controls
  threadsOpen: boolean
  setThreadsOpen: (open: boolean) => void
  threadTabs: ThreadTab[]
  activeConversationId: string
  state: ConversationState | null
  dispatch: (input: InputSignal, opts?: { silentUser?: boolean }) => Promise<boolean> | boolean

  // Journal wizard
  journalWizardOpen: boolean
  journalWizardStep: number
  journalWizardProfile: "general" | "alcohol" | "strict"
  journalWizardTitle: string
  journalWizardProblem: string
  journalWizardGoal: string
  canCreateJournal: boolean
  setJournalWizardStep: (n: number) => void
  setJournalWizardProfile: (p: "general" | "alcohol" | "strict") => void
  setJournalWizardTitle: (s: string) => void
  setJournalWizardProblem: (s: string) => void
  setJournalWizardGoal: (s: string) => void
  closeJournalWizard: () => void
  resetJournalWizardDraft: () => void

  // Journal eval
  journalEvalModalOpen: boolean
  journalEvalLoading: boolean
  journalEvalError: string
  journalEvalSummary: string
  journalEvalQuestions: string[]
  setJournalEvalModalOpen: (open: boolean) => void
  focusInput: () => void
  submitJournalEntry: (opts?: { bypassEval?: boolean }) => Promise<void>

  // Journal details sheet
  journalDetailsOpen: boolean
  journalProfile: "general" | "alcohol" | "strict"
  freeTextEnabled: boolean
  sheetRef: React.RefObject<HTMLDivElement>
  onSheetKeyDown: (e: React.KeyboardEvent) => void
  setJournalDetailsOpen: (open: boolean) => void
  journalTsLocal: string
  setJournalTsLocal: (s: string) => void
  journalMoodTag: string
  setJournalMoodTag: (s: string) => void
  journalMood: string
  setJournalMood: (s: string) => void
  journalTriggerTag: string
  setJournalTriggerTag: (s: string) => void
  journalContextTag: string
  setJournalContextTag: (s: string) => void
  journalCopingTag: string
  setJournalCopingTag: (s: string) => void
  journalAction: string
  setJournalAction: (s: string) => void
  journalCravingPeak: string
  setJournalCravingPeak: (s: string) => void
  journalCravingDuration: string
  setJournalCravingDuration: (s: string) => void

  headerNavHint: string
}

export function ChatHeader(props: ChatHeaderProps) {

  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <div className={styles.title}>Gaarsdal Chat</div>
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
            onClick={() => props.dispatch({ type: "THREAD_CREATE", mode: "normal" } as any, { silentUser: true })}
            disabled={props.loading}
            title="Ny tråd"
            aria-label="Ny tråd"
          >
            <PlusIcon className={styles.actionBtnIcon} />
            <span className={styles.actionBtnLabel}>Ny</span>
          </button>

          <button
            className={styles.actionBtn}
            onClick={() => props.openJournalWizard()}
            disabled={props.loading}
            title="Ny dagbog"
            aria-label="Ny dagbog"
          >
            <PlusIcon className={styles.actionBtnIcon} />
            <span className={styles.actionBtnLabel}>Dagbog</span>
          </button>
        </div>
      </div>

      <JournalWizardModal
        open={props.journalWizardOpen}
        step={props.journalWizardStep}
        profile={props.journalWizardProfile}
        title={props.journalWizardTitle}
        problem={props.journalWizardProblem}
        goal={props.journalWizardGoal}
        canCreate={props.canCreateJournal}
        setStep={props.setJournalWizardStep}
        setProfile={props.setJournalWizardProfile}
        setTitle={props.setJournalWizardTitle}
        setProblem={props.setJournalWizardProblem}
        setGoal={props.setJournalWizardGoal}
        onClose={props.closeJournalWizard}
        onResetDraft={props.resetJournalWizardDraft}
        onCreate={async ({ profile, title, problem, goal }) => {
          const ok = await props.dispatch(
            {
              type: "THREAD_CREATE",
              mode: "normal",
              thread_type: "journal",
              journal_profile: profile,
              journal_init: { title, problem, goal },
            } as any,
            { silentUser: true }
          )
          if (ok) props.closeJournalWizard()
        }}
      />

      <JournalEvalModal
        open={props.journalEvalModalOpen}
        loading={props.journalEvalLoading}
        error={props.journalEvalError}
        summary={props.journalEvalSummary}
        questions={props.journalEvalQuestions}
        onClose={() => props.setJournalEvalModalOpen(false)}
        onBackToEdit={() => {
          props.setJournalEvalModalOpen(false)
          props.focusInput()
        }}
        onSave={async () => {
          props.setJournalEvalModalOpen(false)
          await props.submitJournalEntry({ bypassEval: true })
        }}
      />

      <JournalDetailsSheet
        open={props.journalDetailsOpen && props.journalProfile === "alcohol"}
        disabled={!props.state || !props.freeTextEnabled}
        sheetRef={props.sheetRef}
        onKeyDown={props.onSheetKeyDown}
        onRequestClose={() => {
          props.setJournalDetailsOpen(false)
          props.focusInput()
        }}
        tsLocal={props.journalTsLocal}
        setTsLocal={props.setJournalTsLocal}
        moodTag={props.journalMoodTag}
        setMoodTag={props.setJournalMoodTag}
        mood={props.journalMood}
        setMood={props.setJournalMood}
        triggerTag={props.journalTriggerTag}
        setTriggerTag={props.setJournalTriggerTag}
        contextTag={props.journalContextTag}
        setContextTag={props.setJournalContextTag}
        copingTag={props.journalCopingTag}
        setCopingTag={props.setJournalCopingTag}
        action={props.journalAction}
        setAction={props.setJournalAction}
        cravingPeak={props.journalCravingPeak}
        setCravingPeak={props.setJournalCravingPeak}
        cravingDuration={props.journalCravingDuration}
        setCravingDuration={props.setJournalCravingDuration}
      />

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
          props.dispatch({ type: "THREAD_SWITCH", conversation_id: conversationId } as any, { silentUser: true })
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
