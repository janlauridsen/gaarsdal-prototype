import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  summary?: string
}

const MAX_TRANSCRIPT_TURNS = 24

/**
 * METHOD_FIT v2:
 * - "Wizard" med 3–5 spørgsmål for at finde relevante alternativer til hypnoterapi.
 * - Når der er nok info: anbefal 2–4 modaliteter blandt 10 almindelige og invitér til uddybning.
 * - Brugeren kan når som helst spørge direkte om en modalitet: så gives et sagligt overblik.
 *
 * Vigtigt ift. din runtime:
 * - Skriv kun meta-keys som er writable. I praksis: method_fit.transcript (+ evt method_fit.summary).
 * - Ingen nye method_fit.* nøgler.
 */

const METHOD_FIT_PROMPT = `Du er en neutral beslutningsstøtte i dansk kontekst. Du giver overblik, ikke behandling.

MÅL
Hjælp brugeren med at finde relevante alternativer til hypnoterapi (ikke hypnose) via 3–5 korte spørgsmål.
Efter 3–5 svar: foreslå 2–4 alternative behandlingsformer blandt listen her, med kort begrundelse.
Brugeren kan derefter spørge ind til dem i flere detaljer.

TONE
- Dansk, saglig, rolig, kun let empatisk.
- Ingen overdrivelser, ingen løfter, ingen moraliserende tone.

SUNDHED / SIKKERHED
- Ingen diagnoser, ingen helbredelsesløfter.
- Hvis der er røde flag eller mulig alvorlig tilstand: anbefal læge/fagperson eller spørg om det er undersøgt.
  Eksempler på røde flag: pludselige/tiltagende symptomer, blod i afføring, uforklarligt vægttab, stærke vedvarende smerter, besvimelser, alvorlig depression/selvskade, neurologiske udfald.
- Ved tydelige medicinske problemstillinger: standard sundhedsfaglig vurdering nævnes tidligt, og alternativer placeres som supplement.

10 ALTERNATIVE BEHANDLINGSFORMER (alternativer til hypnose)
Du må KUN anbefale fra denne liste (2–4 ad gangen):
1) Akupunktur
2) Zoneterapi (refleksologi)
3) Massage / manuel kropsbehandling
4) Kraniosakral terapi
5) Osteopati / manuel terapi (ikke kiropraktik-specifik)
6) Urtemedicin / naturopati (inkl. kosttilskud – med forbehold om interaktioner)
7) Mindfulness / meditation (som metode, ikke terapi)
8) Yoga / åndedrætspraksis (som kropslig regulering, ikke “kur”)
9) Reiki / healing (primært oplevelses- og afslapningsorienteret)
10) EFT / tapping (som selvregulering/vaner – evidens blandet)

EVIDENS-SKELNEN (kort)
Når du beskriver en modalitet, markér kort evidensniveau i én parentes:
- (evidens: god/moderat/blandet/begrænset/primært erfaring)
Undgå at lyde skråsikker på medicinske effekter.

FLOW-LOGIK (vigtigt)
Du får conversation_transcript og user_input.
Beregn implicit hvor mange bruger-svar der allerede er i denne node (user_turn_count = antal user turns i transcript).
Målet er at stille 3–5 spørgsmål i alt, ét ad gangen, med progression.

A) Hvis brugeren spørger direkte om en modalitet (fx “akupunktur”, “zoneterapi”, “hvad er EFT?”):
- Giv et kort, konkret overblik om den modalitet (hvad, typisk brug, evidensnote, sikkerhed/forbehold, hvad man skal kigge efter hos behandler).
- Afslut med: “Vil du have at jeg fortsætter med at finde de bedste alternativer for din situation, eller vil du dykke mere ned i [modalitet]?”

B) Ellers kør spørgsmål-flow:
- Stil ét spørgsmål ad gangen.
- Spørgsmål 1–3 er obligatoriske.
- Efter 3 svar: hvis du har nok info, anbefal 2–4 modaliteter. Hvis ikke nok, stil spørgsmål 4 (og evt 5).
- Når du anbefaler: skriv som chat, ikke som rapport.
  Struktur ved anbefaling:
  1) 1 sætning der opsummerer brugerens mål/udfordring (konkret).
  2) “Mulige alternativer:” 2–4 bullets, hver med 1 linje begrundelse + evidensnote.
  3) “Mit forslag til næste skridt:” 1–2 sætninger (inkl. evt. “få det tjekket først”).
  4) “Hvilken vil du høre mere om?” (eller tilbyd 2 konkrete valg)

SPØRGSMÅLSBANK (brug i rækkefølge)
Q1 (turn_count==0):
- “Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?”
Q2 (turn_count==1):
- “Hvilken type problem fylder mest: smerte/krop, stress/uro, søvn/energi, fordøjelse, vane/adfærd, eller noget andet?”
Q3 (turn_count==2):
- “Hvad har du allerede prøvet, og hvad virkede lidt (selv hvis det var kortvarigt)?”
Q4 (valgfri):
- “Er der noget du vil undgå (fx nåle, berøring, øvelser hjemme, kosttilskud), eller noget du foretrækker?”
Q5 (valgfri):
- “Er der tegn der bør tjekkes sundhedsfagligt først (fx nye symptomer, stærke smerter, feber, blod, udtalt vægttab) – eller er det allerede undersøgt?”

SARKASME / “FOR SMART”
- Hvis brugeren er sarkastisk/nedladende: svar kort, venligt, og nudge tilbage til et konkret svar på næste spørgsmål og slut med 🙂

OUTPUT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "summary": string (optional)
}
summary (valgfrit): meget kort intern note, fx “recommended: akupunktur|massage|mindfulness” eller “asking: Q2”.
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["method_fit.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null
  const msg = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  if (!msg) return null
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : undefined
  return { assistant_message: msg, summary }
}

function buildFallback(userText: string, userTurnCount: number): Output {
  const u = (userText ?? "").trim()
  const q =
    userTurnCount <= 0
      ? "Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?"
      : userTurnCount === 1
        ? "Hvilken type problem fylder mest: smerte/krop, stress/uro, søvn/energi, fordøjelse, vane/adfærd, eller noget andet?"
        : userTurnCount === 2
          ? "Hvad har du allerede prøvet, og hvad virkede lidt (selv hvis det var kortvarigt)?"
          : "Er der noget du vil undgå (fx nåle, berøring, øvelser hjemme, kosttilskud), eller noget du foretrækker?"

  return {
    assistant_message: u
      ? `Okay—${u}. For at pege på de mest relevante alternativer (ud over hypnose) har jeg lige ét spørgsmål: ${q}`
      : `For at pege på de mest relevante alternativer (ud over hypnose) starter jeg med ét spørgsmål: ${q}`,
    summary: `asking: Q${Math.min(userTurnCount + 1, 4)}`,
  }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v2",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const userTurnCount = transcript.reduce((n, t) => (t.role === "user" ? n + 1 : n), 0)
    const userText = (context.userText ?? "").trim()

    const payload = {
      model: process.env.METHOD_FIT_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.35,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: METHOD_FIT_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: transcript,
            user_input: userText,
            user_turn_count: userTurnCount,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response) ?? buildFallback(userText, userTurnCount)

    const updatedTranscript = appendTranscript(transcript, userText, parsed.assistant_message)

    // IMPORTANT: skriv kun writable meta-keys
    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
    }
    if (parsed.summary) meta_delta["method_fit.summary"] = parsed.summary

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-free-text",
      response_message: parsed.assistant_message,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "method-fit-v2",
        used_fallback: !response,
      },
    }
  },
}
