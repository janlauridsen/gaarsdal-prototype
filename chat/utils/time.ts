/**
 * Shared time helpers used across the chat system.
 * Centralised here to avoid the same one-liner being copied to every module.
 */

/** Current time in milliseconds since epoch. */
export function nowMs(): number {
  return Date.now()
}

/** Current time as an ISO-8601 string. */
export function nowIso(): string {
  return new Date().toISOString()
}
