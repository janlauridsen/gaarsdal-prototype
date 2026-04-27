// chat/persona/types.ts
// Typer for TTM Persona-motor (Ida TTM).

export interface PersonaValues {
  varme: number           // 1–5
  direkthed: number       // 1–5
  valideringsratio: number // 1–5
  spoergsmaal: number     // 1–5
  abstraktion: number     // 1–5
  svarvolumen: number     // 1–5
}

export interface PersonaState {
  user: PersonaValues      // brugerens eksplicitte valg (sættes via sliders)
  ida: PersonaValues       // Ida's aktuelle justering (auto-justeres per turn)
  idaReason: string        // begrundelse for seneste justering, maks 10 ord
  overrides: Partial<PersonaValues>  // bruger-overrides af Ida's justering
  updatedAt: number        // unix timestamp
}

export const DEFAULT_PERSONA_VALUES: PersonaValues = {
  varme: 3,
  direkthed: 3,
  valideringsratio: 3,
  spoergsmaal: 3,
  abstraktion: 3,
  svarvolumen: 3,
}

export function defaultPersonaState(): PersonaState {
  return {
    user: { ...DEFAULT_PERSONA_VALUES },
    ida: { ...DEFAULT_PERSONA_VALUES },
    idaReason: "",
    overrides: {},
    updatedAt: Date.now(),
  }
}

export type PersonaKey = keyof PersonaValues

export const PERSONA_KEYS: PersonaKey[] = [
  "varme", "direkthed", "valideringsratio", "spoergsmaal", "abstraktion", "svarvolumen",
]
