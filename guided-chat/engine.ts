// guided-chat/engine.ts

import { Signal } from "./signals";
import { handleSignal } from "./engine/handle-signal";
import { evaluateConfidenceTriggers } from "./engine/confidence-triggers";
import { runEngine } from "./engine/run-engine";
import { SessionState } from "./session/session.types";

/**
 * Eneste offentlige indgang til chatbot-kernen.
 * Indfører confidence-baserede system-signaler.
 */
export function runChatbotEngine(
  signal: Signal,
  session: SessionState
) {
  // Først: confidence-baserede triggers
  const systemSignal = evaluateConfidenceTriggers(session);

  const selectedSignal = handleSignal(
    systemSignal ? [systemSignal, signal] : signal
  );

  return runEngine(selectedSignal, session);
}
