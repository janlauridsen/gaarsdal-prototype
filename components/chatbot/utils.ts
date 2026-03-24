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

/**
 * Samtalens tre faser — afledt udelukkende fra eksisterende meta-data.
 *
 * Dagbogslogik: faserne repræsenterer brugerens progression i at forstå
 * sit eget emne — ikke systemets fremskridt. Navnene er holdt korte og
 * neutrale så de ikke føles som en bedømmelse.
 *
 * Fase 1 "Åbner"     — 0-1 AI-svar, samtalen er ny
 * Fase 2 "Undersøger" — 2-4 AI-svar, emnet er etableret
 * Fase 3 "Kredser"   — 5+ AI-svar eller dialog.stage = explore_patterns
 */
export type ConversationPhase = 1 | 2 | 3

export function deriveConversationPhase(meta: Record<string, any> | null | undefined): ConversationPhase {
  if (!meta) return 1

  function readValue(key: string): unknown {
    const entry = meta[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const turnCount = readValue("gen_hypno.assistant_turn_count")
  const stage = readValue("dialog.stage")

  const turns = typeof turnCount === "number" ? turnCount : 0

  if (stage === "explore_patterns" || turns >= 5) return 3
  if (turns >= 2) return 2
  return 1
}

export const PHASE_LABELS: Record<ConversationPhase, string> = {
  1: "Åbner",
  2: "Undersøger",
  3: "Kredser ind",
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
