// guided-chat/guards.ts

/**
 * Guards er udfaset.
 * State- og task-validitet håndteres nu centralt i engine.
 */

export type GuardResult =
  | { allowed: true }
  | { allowed: false; reason: string };

export function evaluateGuards(): GuardResult {
  return { allowed: true };
}
