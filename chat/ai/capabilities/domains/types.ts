import { SafetyDomain } from "../shared/safetyClassifier"
import { TranscriptTurn } from "../shared/transcriptHelpers"

export type PolicySignals = {
  is_practical_request: boolean
  is_closing: boolean
  is_ready_signal?: boolean
  is_child_context?: boolean
  is_alcohol_context?: boolean
}

export interface DomainConfig {
  /** e.g. "gen_hypno", "gen_children", "gen_alcohol" */
  id: string
  transcriptKey: string
  sourceNode: string
  stayOnNode: string
  /** Node to hop to on hard-exit */
  exitTarget: string
  /** Node that triggers client-detection routing (undefined = disabled) */
  clientDetectionNode?: string
  /** Used by safetyClassifier */
  safetyDomain: SafetyDomain
  /** Injected as contextPackSystem role prefix (empty string = use buildSystemPrompt default) */
  roleOverride?: string
  /** Called once on first assistant turn — fire-and-forget, never throws */
  onDialogStart?: () => Promise<void>
  /** Compute domain-specific policy signals */
  computePolicySignals: (
    userText: string,
    transcript: TranscriptTurn[],
  ) => PolicySignals
}
