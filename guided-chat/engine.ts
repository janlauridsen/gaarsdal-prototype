// guided-chat/engine.ts

import { Signal } from "./signals";
import { handleSignal } from "./engine/handle-signal";

// Eksisterende engine-funktionalitet importeres uændret
import { runEngine } from "./engine/run-engine";

/**
 * Eneste offentlige indgang til chatbot-kernen.
 */
export function runChatbotEngine(signal: Signal) {
  const validatedSignal = handleSignal(signal);

  // Al eksisterende logik fortsætter herfra
  return runEngine(validatedSignal);
}
