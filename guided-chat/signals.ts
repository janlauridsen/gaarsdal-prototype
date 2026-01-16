// guided-chat/signals.ts

import { getSignalConfig } from "./config/signal-config";

export interface Signal {
  type: string;
  payload?: unknown;
  source: "ui" | "system";
}

export function createSignal(
  type: string,
  payload: unknown,
  source: "ui" | "system"
): Signal {
  const config = getSignalConfig(type);

  if (!config) {
    throw new Error(`Unknown signal type: ${type}`);
  }

  if (!config.allowedSources.includes(source)) {
    throw new Error(
      `Signal '${type}' not allowed from source '${source}'`
    );
  }

  return {
    type,
    payload,
    source
  };
}
