import crypto from "crypto"

/**
 * Returns a cryptographically random UUID v4.
 * Node 14.17+ (which all current Next.js versions require) always has
 * crypto.randomUUID(), so the randomBytes fallback is dead code and removed.
 */
export function newUuid(): string {
  return crypto.randomUUID()
}
