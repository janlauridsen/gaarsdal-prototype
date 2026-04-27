// chat/persona/prompt.ts
// Oversætter PersonaValues til konkrete LLM-adfærdsinstruktioner.
// Håndterer også personaDelta-parsing og -anvendelse.

import { PERSONA_KEYS, type PersonaValues } from "./types"

// ─── Oversætter PersonaValues → system prompt instruktioner ───────────────────

function varmeInstruction(v: number): string {
  if (v <= 1) return "Hold professionel distance. Undgå empati-markører som 'det lyder svært'."
  if (v <= 2) return "Vær kortfattet og professionel. Brug empati sparsomt og præcist."
  if (v <= 3) return "Balancér varme og professionalisme. Anerkend følelser uden at dvæle ved dem."
  if (v <= 4) return "Vær varm og nærværende. Anerkend brugerens oplevelse eksplicit."
  return "Vær meget varm. Anerkend brugerens oplevelse fuldt ud inden du bevæger dig videre."
}

function direkthedInstruction(v: number): string {
  if (v <= 1) return "Stil kun åbne, udforskende spørgsmål. Undgå konklusioner."
  if (v <= 2) return "Foretræk åbne spørgsmål. Konkluder kun når det er åbenlyst."
  if (v <= 3) return "Balancér udforskende spørgsmål med konkrete observationer."
  if (v <= 4) return "Vær direkte. Del observationer og konklusioner tydeligt."
  return "Vær meget direkte. Sig hvad du ser. Undgå cirkulær udforskning."
}

function valideringsratioInstruction(v: number): string {
  if (v <= 1) return "Valider og spejl fuldt ud. Stil ingen udfordrende spørgsmål."
  if (v <= 2) return "Valider primært. Udfordring er undtagelse og kun meget blidt."
  if (v <= 3) return "Balancér validering og udfordring."
  if (v <= 4) return "Udfordre aktivt. Validering er til stede men udfordring er primær."
  return "Vær udfordrende. Valider kun det der er åbenlyst korrekt. Peg på det der ikke hænger sammen."
}

function spoergsmaalInstruction(v: number): string {
  if (v <= 1) return "Brug cirkulære, brede spørgsmål der åbner mange retninger."
  if (v <= 2) return "Foretræk åbne spørgsmål. Undgå ja/nej-spørgsmål."
  if (v <= 3) return "Mix af åbne og fokuserede spørgsmål."
  if (v <= 4) return "Brug fokuserede spørgsmål der rammer konkret."
  return "Stil præcise, lukkede spørgsmål når det tjener sagen. Effektivitet frem for åbenhed."
}

function abstraktionInstruction(v: number): string {
  if (v <= 1) return "Brug metaforer, billeder og sanselige beskrivelser."
  if (v <= 2) return "Foretræk billedsprog og analogier."
  if (v <= 3) return "Mix af konkret og metaforisk sprog."
  if (v <= 4) return "Brug primært konkret, præcist sprog."
  return "Vær fuldt ud konkret og faktaorienteret. Undgå metaforer."
}

function svarvolumenInstruction(v: number): string {
  if (v <= 1) return "Vær meget kortfattet. Maks 1-2 sætninger. Hold rum."
  if (v <= 2) return "Hold svar korte. 2-3 sætninger max."
  if (v <= 3) return "Standard svarvolumen. 2-3 sætninger."
  if (v <= 4) return "Uddyb gerne. 3-4 sætninger hvis det tjener forståelsen."
  return "Vær uddybende og forklarende når det hjælper. Op til 5 sætninger."
}

export function personaValuesToInstructions(values: PersonaValues): string {
  return [
    `## AKTUEL PERSONA-KONFIGURATION (overskriv standard-adfærd)`,
    ``,
    `Varme (${values.varme}/5): ${varmeInstruction(values.varme)}`,
    `Direkthed (${values.direkthed}/5): ${direkthedInstruction(values.direkthed)}`,
    `Valideringsratio (${values.valideringsratio}/5): ${valideringsratioInstruction(values.valideringsratio)}`,
    `Spørgsmål (${values.spoergsmaal}/5): ${spoergsmaalInstruction(values.spoergsmaal)}`,
    `Abstraktion (${values.abstraktion}/5): ${abstraktionInstruction(values.abstraktion)}`,
    `Svarvolumen (${values.svarvolumen}/5): ${svarvolumenInstruction(values.svarvolumen)}`,
    ``,
    `PERSONA JSON-FORMAT (tilsidesætter standard): Returnér KUN JSON:`,
    `{ "move": "STAY|COMPLEX_REFLECTION|PATTERN|REFRAME|INVITE|QUESTION|ANECDOTE|CHALLENGE", "assistant_message": "...", "crisis_detected": false, "topic": "...", "personaDelta": { "reason": "<maks 10 ord dansk>" } }`,
    `Tilføj til personaDelta de felter der faktisk justeres (varme, direkthed, valideringsratio, spoergsmaal, abstraktion, svarvolumen) med værdier -2, -1, 0, 1 eller 2. Udelad felter der ikke ændres. 0 er ingen ændring. reason er obligatorisk.`,
    `Justering-regler: Send POSITIVE deltas når samtalen kræver mere intensitet, nærhed eller fokus. Send NEGATIVE deltas når samtalen er let, afsluttet eller brugerens energi er dalende. Send INGEN delta-felter (kun reason="ingen ændring") når stemningen er stabil og uændret. Undgå at alle parametre konstant stiger mod 5.`,
  ].join("\n")
}

// ─── PersonaDelta parsing og anvendelse ──────────────────────────────────────

export function parsePersonaDelta(raw: unknown): { delta: Partial<PersonaValues>; reason: string } {
  if (!raw || typeof raw !== "object") return { delta: {}, reason: "" }
  const r = raw as Record<string, unknown>
  const delta: Partial<PersonaValues> = {}
  for (const k of PERSONA_KEYS) {
    const v = r[k]
    if (typeof v === "number" && v !== 0) {
      delta[k] = Math.max(-2, Math.min(2, Math.round(v)))
    }
  }
  const reason = typeof r.reason === "string" ? r.reason.trim().slice(0, 80) : ""
  return { delta, reason }
}

export function applyPersonaDelta(
  userValues: PersonaValues,
  idaValues: PersonaValues,
  delta: Partial<PersonaValues>
): PersonaValues {
  const next = { ...idaValues }
  for (const k of PERSONA_KEYS) {
    if (delta[k] !== undefined && delta[k] !== 0) {
      const raw = idaValues[k] + delta[k]!
      // Clamp: aldrig mere end ±2 fra bruger, aldrig uden for 1-5
      const minV = Math.max(1, userValues[k] - 2)
      const maxV = Math.min(5, userValues[k] + 2)
      next[k] = Math.max(minV, Math.min(maxV, Math.round(raw)))
    }
  }
  return next
}
