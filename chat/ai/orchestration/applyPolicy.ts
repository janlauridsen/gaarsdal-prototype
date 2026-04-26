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

/**
 * Detekterer readiness-signaler — bruger accepterer/bekræfter uden at spørge om kontakt eksplicit.
 * Bruges til at tvinge synthesis + practical_preparation i singleTurnCall.
 */
export function detectReadinessSignal(text: string): boolean {
  const t = normalize(text)
  const exact = [
    "det kan vi godt", "det kan vi godt se på", "det lyder godt", "det prøver jeg",
    "ja det prøver jeg", "godt", "ja tak", "det giver mening", "det giver god mening",
    "det er nok", "ja", "okay", "ok", "lad os det", "det vil jeg gerne",
    "det synes jeg lyder godt", "det er en god idé", "det er en god ide",
    "absolut", "selvfølgelig", "ja selvfølgelig",
  ]
  if (exact.includes(t)) return true
  const phrases = [
    "det kan vi se på", "lad os se på", "det kan vi godt se",
    "det lyder rigtigt", "det lyder som noget", "det passer",
    "det er rigtigt", "det er korrekt", "det stemmer",
    "ja det stemmer", "det er mig", "det genkender jeg",
    "det er præcis", "præcis det", "netop",
  ]
  return phrases.some((p) => t.includes(p))
}

/**
 * Detekterer kontekst der tyder på barn eller forælder-til-barn.
 * Sænker PROGRESSION-tærsklen og tilføjer Jan-invitation i synthesis.
 */
export function detectChildContext(text: string, transcript: TranscriptTurn[]): boolean {
  const all = [text, ...transcript.map(t => t.content)].join(" ").toLowerCase()
  const childWords = [
    "skolen", "skole", "klassen", "klasse", "lektier", "hjemmearbejde",
    "lærer", "læreren", "faget", "karakterer", "eksamener", "eksamen",
    "mit barn", "min søn", "min datter", "vores barn", "han er", "hun er",
    "årig", "år gammel", "årsdag",
    "sengevædning", "tisser i sengen", "tisser om natten",
  ]
  return childWords.some((w) => all.includes(w))
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

  // Somatiske/kropslige distress-markører
  const somatic = [
    "hjertebanken", "banker hurtigt", "banker vildt",
    "svedige", "sveder", "koldsved",
    "ryster", "ryster af", "kroppen ryster",
    "ude af kontrol", "ud af kontrol", "mister kontrollen", "miste kontrollen",
    "kvalm", "svimmel", "svimmelhed",
    "panik", "panikanfald", "angstanfald",
    "åndenød", "kan ikke trække vejret", "kortåndet",
    "kramper", "spændt i kroppen", "kroppen reagerer",
    "overvældet", "overvælde", "det er overvældende",
  ]
  if (somatic.some((x) => normalize(t).includes(x))) score += 0.30

  // Emotionel dybde — tunge personlige temaer
  const emotionalDepth = [
    "frygt for at miste", "bange for at miste",
    "skuffe dem", "skuffer dem",
    "ikke god nok", "ikke er god nok",
    "følelse af skyld", "skyldfølelse", "føler skyld",
    "skam", "skammer mig",
    "udmattet", "udbrændt", "tærer på mig",
    "ensomhed", "ensom", "alene med det",
    "meningsløst", "giver ikke mening",
    "taber mig selv", "mister mig selv",
  ]
  if (emotionalDepth.some((x) => normalize(t).includes(x))) score += 0.20

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

/**
 * Deterministisk routing-detektion.
 * Returnerer true KUN når brugeren eksplicit tager et konkret skridt mod kontakt/booking.
 * Problem-beskrivelser, mål og spørgsmål returnerer ALTID false.
 *
 * Princip: imperativ handling ("vil gerne booke", "ring til mig") — ikke beskrivelse eller ønske.
 */
export function detectContactBookingIntent(text: string): boolean {
  const t = normalize(text)

  // Eksplicitte booking/kontakt-handlinger
  const bookingPhrases = [
    // Booking
    "vil gerne booke",
    "vil booke",
    "book en tid",
    "booke en tid",
    "bestille en tid",
    "bestil en tid",
    "vil aftale",
    "aftale en tid",
    "aftale tid",
    "aftale et møde",
    // Kontakt-handlinger (ikke spørgsmål)
    "vil gerne i kontakt",
    "gerne i kontakt",
    "vil kontaktes",
    "vil kontakte",
    "vil gerne kontakte",
    "vil have kontakt",
    "tag kontakt",
    "vil kontakte jan",
    "vil kontakte jer",
    "kontakt mig",
    "vil kontakte nu",
    // Tidspunkt
    "hvornår kan jeg komme",
    "hvornår har du tid",
    "hvornår har i tid",
    // Møde/samtale
    "kan jeg komme til en samtale",
    "komme til en samtale",
    "til en session",
    // Direkte kommunikation
    "ring til mig",
    "ringe til mig",
    "vil gerne ringes op",
    "vil have jan til at ringe",
    "send mig en besked",
  ]

  if (bookingPhrases.some((p) => t.includes(p))) return true

  // "kontakt" som imperativ/handlingsord — ikke spørgsmål eller problem-beskrivelse
  if (
    t.includes("kontakt") &&
    !t.includes("?") &&
    !t.includes("hvordan") &&
    !t.includes("kan jeg") &&
    !t.includes("hvad") &&
    !t.includes("hvis")
  ) {
    if (t.includes("jan") || t.includes("jer") || t.includes("dig") || t.includes("klinikken")) return true
  }

  return false
}
