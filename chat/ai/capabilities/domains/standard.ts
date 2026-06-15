import {
  detectPracticalKeywords,
  detectClosingText,
  detectReadinessSignal,
  detectChildContext,
} from "../../orchestration/applyPolicy"
import { TranscriptTurn } from "../shared/transcriptHelpers"
import { DomainConfig, PolicySignals } from "./types"

export const STANDARD_DOMAIN: DomainConfig = {
  id: "gen_hypno",
  transcriptKey: "gen_hypno.transcript",
  sourceNode: "GEN_HYPNO",
  stayOnNode: "GEN_HYPNO",
  exitTarget: "HOME",
  clientDetectionNode: "GEN_HYPNO",
  safetyDomain: "standard",

  computePolicySignals(userText: string, transcript: TranscriptTurn[]): PolicySignals {
    return {
      is_practical_request: detectPracticalKeywords(userText),
      is_closing: detectClosingText(userText),
      is_ready_signal: detectReadinessSignal(userText),
      is_child_context: detectChildContext(userText, transcript),
    }
  },
}
