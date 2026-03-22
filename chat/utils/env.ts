/**
 * Parse a positive integer from an environment variable.
 * Returns `fallback` if the variable is missing, empty, or not a finite positive integer.
 */
export function envInt(name: string, fallback: number): number {
  const v = process.env[name]
  if (!v) return fallback
  const n = Number.parseInt(v.trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/**
 * Returns true when the environment variable is set to "1", "true", "yes", or "on"
 * (case-insensitive).
 */
export function envBool(name: string): boolean {
  const v = process.env[name]
  if (!v) return false
  const t = v.trim().toLowerCase()
  return t === "1" || t === "true" || t === "yes" || t === "on"
}
