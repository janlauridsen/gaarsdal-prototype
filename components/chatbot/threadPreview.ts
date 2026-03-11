import type { ThreadTab } from "./types"

export function formatThreadPreview(t: ThreadTab): string {
  const raw = (t.preview || "").trim()
  if (!raw) return ""

  const extractStringField = (src: string, key: string) => {
    const re = new RegExp(`"${key}"\\s*:\\s*"([^"]*)`, "i")
    const m = src.match(re)
    if (!m) return ""
    const v = String(m[1] ?? "")
    return v
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\"/g, '"')
      .trim()
  }

  const extractNumberField = (src: string, key: string): number | null => {
    const re = new RegExp(`"${key}"\\s*:\\s*(-?\\d+)`, "i")
    const m = src.match(re)
    if (!m) return null
    const n = Number.parseInt(String(m[1]), 10)
    return Number.isFinite(n) ? n : null
  }

  if ((t.thread_type ?? "chat") === "journal") {
    try {
      const obj = JSON.parse(raw)
      const text = String(obj?.text || "").trim()
      const parts: string[] = []
      if (typeof obj?.drinks === "number") parts.push(`Drinks: ${obj.drinks}`)
      if (typeof obj?.urge_0_10 === "number") parts.push(`Urge: ${obj.urge_0_10}/10`)
      if (typeof obj?.sleep_h === "number") parts.push(`Søvn: ${obj.sleep_h}t`)
      const suffix = parts.length ? ` • ${parts.join(" • ")}` : ""
      return (text || "(notat)") + suffix
    } catch {
      // fall through to loose extraction
    }

    const text = extractStringField(raw, "text")
    const drinks = extractNumberField(raw, "drinks")
    const urge = extractNumberField(raw, "urge_0_10")
    const sleep = extractNumberField(raw, "sleep_h")

    const parts: string[] = []
    if (typeof drinks === "number") parts.push(`Drinks: ${drinks}`)
    if (typeof urge === "number") parts.push(`Urge: ${urge}/10`)
    if (typeof sleep === "number") parts.push(`Søvn: ${sleep}t`)
    const suffix = parts.length ? ` • ${parts.join(" • ")}` : ""

    const cleanedText = (text || "").trim()
    return (cleanedText || "(notat)") + suffix
  }

  return raw
}
