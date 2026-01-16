// guided-chat/engine/handle-signal.ts

import { Signal } from "../signals";
import { getSignalConfig } from "../config/signal-config";
import { prioritizeSignals } from "./prioritize-signals";

/**
 * Central indgang til engine.
 * Modtager ét eller flere signaler og vælger ét autoritativt.
 */
export function handleSignal(
  signalOrSignals: Signal | Signal[]
): Signal {
  const signals = Array.isArray(signalOrSignals)
    ? signalOrSignals
    : [signalOrSignals];

  // Valider alle signaler
  for (const signal of signals) {
    const config = getSignalConfig(signal.type);
    if (!config) {
      throw new Error(`Signal '${signal.type}' mangler konfiguration`);
    }
  }

  // Prioritér
  const [selected] = prioritizeSignals(signals);

  if (!selected) {
    throw new Error("Ingen signaler tilgængelige efter prioritering");
  }

  return selected;
}
