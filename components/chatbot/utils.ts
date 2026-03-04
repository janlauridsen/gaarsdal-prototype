export function safeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function trimDuplicateTitle(s: string) {
  const parts = s
    .split("—")
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0]
  return s.trim()
}

export function splitThreadLabel(label: string): { title: string; preview: string } {
  const cleaned = trimDuplicateTitle(label || "").trim()
  if (!cleaned) return { title: "", preview: "" }

  const idx = cleaned.indexOf("—")
  if (idx < 0) return { title: cleaned, preview: "" }

  const title = cleaned.slice(0, idx).trim()
  const preview = cleaned.slice(idx + 1).trim()
  if (!title) return { title: cleaned, preview: "" }
  return { title, preview }
}

export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}
