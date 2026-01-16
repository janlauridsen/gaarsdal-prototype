// guided-chat/free-text-router.ts

import { SignalResult, noneSignal } from "./signals";

/**
 * Fritekst-routing er udfaset.
 * Al fritekst behandles nu som recovery-input i engine.
 */
export function resolveFreeTextSignal(): SignalResult {
  return noneSignal;
}
