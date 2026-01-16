// guided-chat/engine.ts

import { Signal } from "./signals";
import { handleSignal } from "./engine/handle-signal";
import { evaluateConfidenceTriggers } from "./engine/confidence-triggers";
import { maybeBuildSummary } from "./engine/summary-trigger";
import { runEngine } from "./engine/run-engine";
import { SessionState } from "./session/session.types";

/**
 * Eneste offentlige indgang til chatbot-kernen.
 * Aktiverer signal-prioritering, confidence-triggers og opsummering.
 */
export function runChatbotEngine(
  signal: Signal,
  session: SessionState
) {
  // 1) Confidence-baserede system-signaler
  const systemSignal = evaluateConfidenceTriggers(session);

  // 2) Vælg autoritativt signal
  const selectedSignal = handleSignal(
    systemSignal ? [systemSignal, signal] : signal
  );

  // 3) Kør eksisterende engine
  const result = runEngine(selectedSignal, session);

  // 4) Evt. opsummering som state-output
  const summary = maybeBuildSummary(session);

  if (summary) {
    return {
      ...result,
      output: summary
    };
  }

  return result;
}
