import { PromptMode } from "../../contracts/turnAnalysis"
import { TranscriptTurn, stripPunctuation } from "./transcriptHelpers"

export function isHardExit(text: string): boolean {
  const t = stripPunctuation(text)
  const exact = ["stop", "afslut", "slut", "tilbage", "hjem", "home", "menu", "hovedmenu", "ikke nu"]
  if (exact.includes(t)) return true
  const phrases = [
    "gå tilbage",
    "gaa tilbage",
    "tilbage til menu",
    "tilbage til hovedmenu",
    "gå til menu",
    "gaa til menu",
    "gå hjem",
    "gaa hjem",
  ].map(stripPunctuation)
  return phrases.some((p) => ` ${t} `.includes(` ${p} `))
}

export function buildClosingMessage(transcript: TranscriptTurn[]): string {
  const last = [...transcript].reverse().find((t) => t.role === "assistant")
  if (!last) return "Selv tak."
  if (/^selv tak[.!]?$/i.test(last.content.trim())) return "Det var så lidt."
  return "Selv tak."
}

export function buildFallbackMessage(mode: PromptMode, transcript: TranscriptTurn[], topic?: string): string {
  if (mode === "closing") return buildClosingMessage(transcript)
  if (mode === "practical")
    return "Du kan kontakte Jan på +45 42 80 74 74 eller jan@gaarsdal.net. Hvis du vil, kan du kort beskrive hvad du ønsker hjælp til og spørge om ledige tider."
  if (mode === "evidence")
    return "Hypnoterapi bruges som støtte til vaneændring, ro og mønsterarbejde, men evidensen varierer efter problemtype og er ofte blandet. Det giver typisk mest mening som del af en bredere indsats."
  if (mode === "reflection") {
    const lead = topic
      ? `Det ligner, at ${topic} hurtigt bliver et sted, hvor du prøver at få kontrol eller afstand. `
      : "Det ligner, at oplevelse, kropslig reaktion og forsøg på at få kontrol hurtigt smelter sammen. "
    return lead + "Det mest interessante er ikke kun følelsen, men hvad du gør i samme øjeblik for at slippe væk fra den."
  }
  return "Jeg kan godt hjælpe med at forstå det nærmere. Det giver mest mening at tage udgangspunkt i hvad der sker i dig eller din hverdag, frem for generel metodeforklaring."
}
