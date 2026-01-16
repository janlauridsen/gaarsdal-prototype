// guided-chat/engine/recovery-handler.ts

import { Signal } from "../signals";
import { SessionState } from "../session/session.types";

/**
 * Fritekst må aldrig styre navigation.
 * Den kan kun bruges til recovery og afklaring.
 */
export function handleRecoveryInput(
  signal: Signal,
  session: SessionState
): Signal | null {
  if (signal.type !== "clarification") {
    return null;
  }

  return {
    type: "system_internal",
    payload: {
      reason: "recovery_from_free_text",
      text: signal.payload
    },
    source: "system"
  };
}
