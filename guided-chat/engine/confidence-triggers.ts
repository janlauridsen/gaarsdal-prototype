// guided-chat/engine/confidence-triggers.ts

import { SessionState } from "../session/session.types";
import { getConfidenceConfig } from "../config/confidence-config";
import { Signal } from "../signals";

/**
 * Afgør om confidence-niveauer udløser system-signaler.
 * Returnerer evt. et system-signal, ellers null.
 */
export function evaluateConfidenceTriggers(
  session: SessionState
): Signal | null {
  for (const dimension of Object.keys(session.confidence)) {
    const cfg = getConfidenceConfig(dimension as any);
    if (!cfg) continue;

    const value = session.confidence[dimension as keyof typeof session.confidence];

    if (value <= cfg.escalationThreshold) {
      return {
        type: "system_internal",
        payload: {
          reason: "escalation",
          dimension,
          value
        },
        source: "system"
      };
    }

    if (value <= cfg.recoveryThreshold) {
      return {
        type: "system_internal",
        payload: {
          reason: "recovery",
          dimension,
          value
        },
        source: "system"
      };
    }
  }

  return null;
}
