/**
 * clientDetection.ts
 *
 * Lightweight detektion af signaler der tyder på at brugeren
 * allerede er aktiv klient hos Jan Gaarsdal.
 *
 * Design-principper:
 * - Ren funktion, ingen LLM, ingen async
 * - Scorer signaler i to kategorier: stærke (0.4) og svage (0.2)
 * - Kræver sum >= 0.6 for at klassificere som klient
 * - Falsk positiv er dyrere end falsk negativ:
 *   hellere sende én reel klient til GEN_HYPNO end at sende
 *   en nysgerrig besøgende til CLIENT_SUPPORT
 */

export type ClientSignalResult = {
  isClient: boolean
  confidence: number       // 0–1
  signals: string[]        // hvilke markører der slog til
}

type Turn = { role: "user" | "assistant"; content: string }

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

// ─── Signalkategorier ─────────────────────────────────────────────────────────

/**
 * Stærke signaler: næsten kun eksisterende klienter bruger disse formuleringer.
 * Hvert signal bidrager 0.4 til confidence.
 */
const STRONG_SIGNALS: Array<{ pattern: string; label: string }> = [
  // Direkte session-reference
  { pattern: "forrige session",       label: "ref:forrige_session" },
  { pattern: "siden sidst",           label: "ref:siden_sidst" },
  { pattern: "sidst vi snakkede",     label: "ref:sidst_vi_snakkede" },
  { pattern: "forrige gang vi",       label: "ref:forrige_gang_vi" },
  { pattern: "næste session",         label: "ref:naeste_session" },
  { pattern: "vores session",         label: "ref:vores_session" },
  { pattern: "min session",           label: "ref:min_session" },
  { pattern: "i min session",         label: "ref:i_min_session" },

  // Jan-reference i personlig kontekst
  { pattern: "jan sagde",             label: "jan:sagde" },
  { pattern: "jan anbefalede",        label: "jan:anbefalede" },
  { pattern: "jan foreslog",          label: "jan:foreslog" },
  { pattern: "da jeg var hos jan",    label: "jan:var_hos" },
  { pattern: "hos jan",               label: "jan:hos" },
  { pattern: "jan gav mig",           label: "jan:gav_mig" },
  { pattern: "jan bad mig",           label: "jan:bad_mig" },

  // Øvelse-reference der klart er personlig
  { pattern: "øvelsen jan",           label: "exercise:jan" },
  { pattern: "øvelsen vi lavede",     label: "exercise:vi_lavede" },
  { pattern: "øvelsen fra",           label: "exercise:fra" },
  { pattern: "den øvelse vi",         label: "exercise:den_vi" },

  // Forløbs-reference
  { pattern: "vores forløb",          label: "process:vores_forloeb" },
  { pattern: "mit forløb",            label: "process:mit_forloeb" },
  { pattern: "vi arbejder med",       label: "process:vi_arbejder_med" },
  { pattern: "vi har arbejdet med",   label: "process:vi_har_arbejdet" },
  { pattern: "vi arbejdede med",      label: "process:vi_arbejdede_med" },
]

/**
 * Svage signaler: tyder på klient-relation men kan forekomme hos nysgerrige.
 * Hvert signal bidrager 0.2. Kræver typisk 2+ for at nå threshold.
 */
const WEAK_SIGNALS: Array<{ pattern: string; label: string }> = [
  { pattern: "øvelse",                label: "weak:oevelse" },
  { pattern: "øvelsen",               label: "weak:oevelsen" },
  { pattern: "trancen",               label: "weak:trancen" },
  { pattern: "sessionen",             label: "weak:sessionen" },
  { pattern: "forrige gang",          label: "weak:forrige_gang" },
  { pattern: "vi snakkede om",        label: "weak:vi_snakkede_om" },
  { pattern: "du sagde",              label: "weak:du_sagde" },
  { pattern: "vi talte om",           label: "weak:vi_talte_om" },
  { pattern: "sidst vi",              label: "weak:sidst_vi" },
  { pattern: "har haft session",      label: "weak:haft_session" },
  { pattern: "efter sessionen",       label: "weak:efter_sessionen" },
  { pattern: "mellem sessionerne",    label: "weak:mellem_sessionerne" },
  { pattern: "i forløbet",            label: "weak:i_forlobet" },
]

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Scorer en enkelt tekst-streng.
 * Returnerer raw confidence og hvilke signaler der slog til.
 */
export function scoreClientSignals(text: string): { score: number; signals: string[] } {
  const t = normalize(text)
  const signals: string[] = []
  let score = 0

  for (const { pattern, label } of STRONG_SIGNALS) {
    if (t.includes(pattern)) {
      signals.push(label)
      score += 0.4
    }
  }

  for (const { pattern, label } of WEAK_SIGNALS) {
    if (t.includes(pattern)) {
      // Undgå dobbelt-tæl hvis stærkt signal allerede fangede det
      if (!signals.some((s) => s.startsWith("ref:") || s.startsWith("exercise:") || s.startsWith("process:"))) {
        signals.push(label)
        score += 0.2
      }
    }
  }

  return { score: Math.min(1, score), signals }
}

/**
 * Primær eksport: analysér nuværende bruger-turn + optionelt de seneste
 * bruger-turns fra transcript for at øge robusthed.
 *
 * Logik:
 * - Scorer current turn (vægter 0.7)
 * - Scorer seneste 2 bruger-turns fra transcript (vægter 0.3 tilsammen)
 * - isClient = true hvis blended score >= 0.6
 */
export function detectClientSignals(
  currentText: string,
  transcript: Turn[] = []
): ClientSignalResult {
  const { score: currentScore, signals: currentSignals } = scoreClientSignals(currentText)

  // Scan seneste 2 bruger-turns for kontekst
  const recentUserTurns = transcript
    .filter((t) => t.role === "user")
    .slice(-2)
    .map((t) => t.content)

  const historyScores = recentUserTurns.map((text) => scoreClientSignals(text))
  const historyScore = historyScores.reduce((acc, { score }) => acc + score, 0) / Math.max(1, historyScores.length)
  const historySignals = historyScores.flatMap(({ signals }) => signals)

  const blended = currentScore * 0.7 + historyScore * 0.3
  const allSignals = [...new Set([...currentSignals, ...historySignals])]

  return {
    isClient: blended >= 0.6,
    confidence: Math.round(blended * 100) / 100,
    signals: allSignals,
  }
}
