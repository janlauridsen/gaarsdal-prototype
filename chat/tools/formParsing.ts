/**
 * Very small, text-first "form" parser.
 *
 * Input format (one per line):
 *   key: value
 *
 * - Keys are trimmed and lower-cased.
 * - Lines without ':' are ignored.
 *
 * This is intentionally simple for V1: UI does not render real forms yet.
 */
export function parseFormText(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const idx = line.indexOf(":")
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()
    if (!key) continue
    if (!value) continue
    out[key] = value
  }
  return out
}
