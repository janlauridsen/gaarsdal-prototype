// guided-chat/engine.ts

import { Signal } from "./signals";
import { handleSignal } from "./engine/handle-signal";
import { evaluateConfidenceTriggers } from "./engine/confidence-triggers";
import { maybeBuildSummary } from "./engine/summary-trigger";
import { runEngine } from "./engine/run-engine";
import { SessionState } from "./session/session.types";

/**
 * Eneste offentlige indgang til chatbot-kernen.
 * Samler:
 * - confidence-triggers
 * - signal-prioritering
 * - recovery-håndtering
 * - opsummering
 */
export function runChatbotEngine(
  signal: Signal,
  session: SessionState
) {
  // 1) Confidence-baserede system-signaler
  const systemSignal = evaluateConfidenceTriggers(session);

  // 2) Vælg autoritativt signal (session kræves nu)
  const selectedSignal = handleSignal(
    systemSignal ? [systemSignal, signal] : signal,
    session
  );

  // 3) Kør engine (tasks, globale intents, states)
  const result = runEngine(selectedSignal, session);

  // 4) Evt. opsummering som output
  const summary = maybeBuildSummary(session);

  if (summary) {
    return {
      ...result,
      output: summary
    };
  }

  return result;
}
