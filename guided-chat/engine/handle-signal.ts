// guided-chat/engine/handle-signal.ts

import { Signal } from "../signals";
import { getSignalConfig } from "../config/signal-config";
import { prioritizeSignals } from "./prioritize-signals";
import { handleRecoveryInput } from "./recovery-handler";

/**
 * Central indgang til engine.
 * Fritekst degraderes til recovery-signal.
 */
export function handleSignal(
  signalOrSignals: Signal | Signal[],
  session: any
): Signal {
  const incoming = Array.isArray(signalOrSignals)
    ? signalOrSignals
    : [signalOrSignals];

  const expanded: Signal[] = [];

  for (const signal of incoming) {
    const cfg = getSignalConfig(signal.type);
    if (!cfg) {
      throw new Error(`Signal '${signal.type}' mangler konfiguration`);
    }

    // Degrader fritekst til recovery-signal
    const recovery = handleRecoveryInput(signal, session);
    if (recovery) {
      expanded.push(recovery);
    } else {
      expanded.push(signal);
    }
  }

  const [selected] = prioritizeSignals(expanded);

  if (!selected) {
    throw new Error("Ingen signaler efter prioritering");
  }

  return selected;
}
