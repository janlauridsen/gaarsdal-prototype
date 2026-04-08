export type ArousalLevel = "low" | "elevated" | "high"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

/**
 * Detekterer praktiske nøgleord der sendes som policy-hint til LLM.
 * Bruges som is_practical_request i policySignals — ikke som post-hoc override.
 */
export function detectPracticalKeywords(text: string): boolean {
  const t = normalize(text)
  return ["kontakt", "booking", "booke", "telefon", "mail", "e-mail", "email", "pris", "koster", "koste", "betale", "betaling", "adresse", "tid", "ledige tider"].some((x) => t.includes(x))
}

/**
 * Detekterer eksplicitte afslutningstegn der sendes som policy-hint til LLM.
 * Bruges som is_closing i policySignals — ikke som post-hoc override.
 */
export function detectClosingText(text: string): boolean {
  const t = text.trim().toLowerCase()
  const exact = [
    "tak", "ok tak", "okay tak", "mange tak",
    "ha det godt", "hav det godt", "vi tales ved", "farvel", "hej hej",
    "det var nyttigt", "det hjælper", "det er nok",
    "tusind tak", "tak for det", "tak skal du have",
  ]
  if (exact.includes(t)) return true
  const phrases = [
    "jeg er færdig", "lad os stoppe", "det var alt",
    "tak for hjælpen", "tak for din hjælp", "det var meget nyttigt",
    "jeg tager det med mig", "jeg tænker over det",
  ]
  return phrases.some((p) => t.includes(p))
}

// ─── Window of Tolerance ─────────────────────────────────────────────────────
// Scorer sproglige arousal-markører pr. turn.
// Teori: Siegel / Ogden — Somatic/Polyvagal

function scoreArousalTurn(text: string): number {
  const t = text.trim()
  if (!t) return 0

  let score = 0
  const words = t.split(/\s+/)
  const wordCount = words.length

  const catastrophe = ["aldrig", "altid", "umuligt", "håbløst", "haabloest", "ingenting", "ødelægger", "oedelaegger", "komplet fiasko"]
  if (catastrophe.some((x) => normalize(t).includes(x))) score += 0.25

  const intensity = ["virkelig", "ekstremt", "så meget", "saa meget", "utroligt", "sindssygt", "fuldstændig", "fuldstaendig", "ufatteligt"]
  if (intensity.some((x) => normalize(t).includes(x))) score += 0.15

  const urgency = ["jeg kan ikke mere", "det er for meget", "jeg holder ikke ud", "jeg bryder sammen"]
  if (urgency.some((x) => normalize(t).includes(x))) score += 0.25

  const exclamations = (t.match(/!/g) ?? []).length
  if (exclamations >= 2) score += 0.15
  else if (exclamations === 1) score += 0.05

  if (wordCount >= 3) {
    const avgWordLen = t.replace(/\s+/g, "").length / wordCount
    if (avgWordLen < 3.5) score += 0.10
  }

  if (wordCount <= 3) score += 0.20

  const normalized = normalize(t)
  const passive = ["ligemeget", "ved ikke", "måske", "maaske", "det er fint", "uanset"]
  const passiveMatches = passive.filter((x) => normalized === x || normalized.startsWith(x + " ") || normalized.endsWith(" " + x)).length
  if (passiveMatches >= 2) score += 0.25
  else if (passiveMatches === 1 && wordCount <= 5) score += 0.15

  const hasVerb = ["er", "har", "kan", "vil", "gør", "tænker", "føler", "prøver", "ved", "sker"].some((v) => normalized.split(/\s+/).includes(v))
  if (!hasVerb && wordCount >= 4) score += 0.10

  return Math.min(1, score)
}

/**
 * Beregner rolling arousal-level fra seneste bruger-turns.
 * Nyeste turn vægter 0.6, næstnyeste 0.3, den før 0.1.
 * previousScore (fra meta) bidrager med 20% inertia mod pludselige skift.
 */
export function computeRollingArousal(
  transcript: TranscriptTurn[],
  currentUserText: string,
  previousScore = 0
): { level: ArousalLevel; score: number } {
  const userTurns = transcript.filter((t) => t.role === "user").slice(-2)

  const s0 = userTurns[0] ? scoreArousalTurn(userTurns[0].content) : 0
  const s1 = userTurns[1] ? scoreArousalTurn(userTurns[1].content) : 0
  const s2 = scoreArousalTurn(currentUserText)

  const weighted = s0 * 0.1 + s1 * 0.3 + s2 * 0.6
  const blended = previousScore * 0.2 + weighted * 0.8

  const level: ArousalLevel =
    blended >= 0.55 ? "high" :
    blended >= 0.30 ? "elevated" :
    "low"

  return { level, score: Math.round(blended * 1000) / 1000 }
}
