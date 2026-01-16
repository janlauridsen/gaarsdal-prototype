// guided-chat/engine/prioritize-signals.ts

import { Signal } from "../signals";
import { getSignalConfig } from "../config/signal-config";

/**
 * Sorterer signaler efter konfigureret prioritet.
 * Højere tal = højere prioritet.
 */
export function prioritizeSignals(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) => {
    const aCfg = getSignalConfig(a.type);
    const bCfg = getSignalConfig(b.type);

    if (!aCfg || !bCfg) {
      throw new Error("Signal uden konfiguration opdaget under prioritering");
    }

    return bCfg.priority - aCfg.priority;
  });
}
