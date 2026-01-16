// guided-chat/engine/handle-signal.ts

import { Signal } from "../signals";
import { getSignalConfig } from "../config/signal-config";

/**
 * Central indgang til engine.
 * Alle signaler skal igennem denne funktion.
 */
export function handleSignal(signal: Signal): Signal {
  const config = getSignalConfig(signal.type);

  if (!config) {
    throw new Error(`Signal '${signal.type}' has no configuration`);
  }

  // Prioritet og klassifikation er nu entydigt defineret her.
  // I dette trin ændres ingen adfærd – kun centralisering.
  return signal;
}
