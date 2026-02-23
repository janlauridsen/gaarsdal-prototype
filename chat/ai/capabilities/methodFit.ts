import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  summary?: string

  // Optional “structured” outputs we can write into whitelisted meta keys
  close_signal?: boolean
  confidence?: number
  relevance?: number
  tags?: string[]
  next_question?: string
  questions_remaining?: number
  chips?: Array<{ id: string; label: string }>
}

const MAX_TRANSCRIPT_TURNS = 24

// 10 alternative modaliteter (alternativer til hypnose/hypnoterapi).
const MODALITIES: Array<{ id: string; label: string; keywords: string[] }> = [
  { id: "akupunktur", label: "Akupunktur", keywords: ["akupunktur", "nåle"] },
  { id: "zoneterapi", label: "Zoneterapi", keywords: ["zoneterapi", "refleksologi"] },
  { id: "massage", label: "Massage / manuel kropsbehandling", keywords: ["massage", "massør", "manuel"] },
  { id: "kraniosakral", label: "Kraniosakral terapi", keywords: ["kranio", "kraniosakral"] },
  { id: "osteopati", label: "Osteopati / manuel terapi", keywords: ["osteopati", "manuel terapi"] },
  { id: "urter", label: "Urtemedicin / naturopati", keywords: ["urter", "urtemedicin", "naturopati", "kosttilskud"] },
  { id: "mindfulness", label: "Mindfulness / meditation", keywords: ["mindfulness", "meditation"] },
  { id: "yoga", label: "Yoga / åndedrætspraksis", keywords: ["yoga", "åndedræt", "vejrtrækning"] },
  { id: "reiki", label: "Reiki / healing", keywords: ["reiki", "healing"] },
  { id: "eft", label: "EFT / tapping", keywords: ["eft", "tapping", "bankeøvelser"] },
]

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

  const out: Output = { assistant_message: msg }

  if (typeof raw.summary === "string") out.summary = raw.summary.trim()
  if (typeof raw.close_signal === "boolean") out.close_signal = raw.close_signal
  if (typeof raw.confidence === "number") out.confidence = raw.confidence
  if (typeof raw.relevance === "number") out.relevance = raw.relevance
  if (Array.isArray(raw.tags)) out.tags = raw.tags.filter((x) => typeof x === "string") as string[]
  if (typeof raw.next_question === "string") out.next_question = raw.next_question.trim()
  if (typeof raw.questions_remaining === "number") out.questions_remaining = raw.questions_remaining

  if (Array.isArray(raw.chips)) {
    const chips = raw.chips
      .filter((c) => c && typeof c === "object")
      .map((c: any) => ({
        id: typeof c.id === "string" ? c.id : "",
        label: typeof c.label === "string" ? c.label : "",
      }))
      .filter((c) => c.id && c.label)
    if (chips.length) out.chips = chips
  }

  return out
}

function getQuestionCountFromMeta(context: AiCapabilityContext): number | null {
  const v = context.state.meta["method_fit.question_count"]?.value
  if (typeof v === "number" && Number.isFinite(v)) return v
  const n = Number(v)
  if (Number.isFinite(n)) return n
  return null
}

function computeQuestionCountFromTranscript(transcript: TranscriptTurn[]): number {
  // Vi tæller kun de bruger-inputs der er givet i denne node (transcript er node-specifikt).
  // Det er “spørgsmålsflowets” count, ikke total turns.
  return transcript.reduce((n, t) => (t.role === "user" ? n + 1 : n), 0)
}

function detectDirectModalityQuestion(userText: string): { id: string; label: string } | null {
  const t = (userText ?? "").toLowerCase()
  if (!t) return null
  for (const m of MODALITIES) {
    if (m.keywords.some((k) => t.includes(k))) return { id: m.id, label: m.label }
  }
  return null
}

const METHOD_FIT_PROMPT = `Du er en neutral beslutningsstøtte i dansk kontekst. Du giver overblik, ikke behandling.

MÅL
Brug 3–5 korte spørgsmål (ét ad gangen) til at finde en relevant “hypno plus” retning:
- Hypnoterapi (altid med)
- plus 2–3 andre almindelige alternative tilgange der typisk matcher situationen.
Når der er nok info: foreslå hypnoterapi + 2–3 behandlingsformer blandt de 10 nedenfor, og invitér brugeren til at spørge ind til dem.

TONE
- Dansk, rolig, saglig, kun let empatisk.
- Start altid med at svare på / spejle det konkrete user_input.

SIKKERHED
- Ingen diagnoser, ingen helbredelsesløfter.
- Hvis der er tegn på røde flag eller noget der bør vurderes sundhedsfagligt: foreslå læge/fagperson eller spørg om det er undersøgt.
  Eksempler: blod, feber, pludselig forværring, uforklarligt vægttab, stærke vedvarende smerter, besvimelser, neurologiske udfald, alvorlig psykisk krise/selvskade.

Hypnoterapi (altid med)
- Du må gerne anbefale hypnoterapi som relevant (eller som supplement/ikke førstevalg afhængigt af situationen).

10 ALTERNATIVE BEHANDLINGSFORMER (udover hypnoterapi — du må kun foreslå fra denne liste)
1) Akupunktur
2) Zoneterapi
3) Massage / manuel kropsbehandling
4) Kraniosakral terapi
5) Osteopati / manuel terapi
6) Urtemedicin / naturopati (kosttilskud) — nævn interaktioner/forbehold kort
7) Mindfulness / meditation
8) Yoga / åndedrætspraksis
9) Reiki / healing
10) EFT / tapping

EVIDENS-SKELNEN
Når du beskriver en modalitet, markér kort i parentes:
(evidens: god/moderat/blandet/begrænset/primært erfaring)
Undgå skråsikre medicinske effekter.

INPUT
Du får JSON med:
- conversation_transcript
- user_input
- question_count (antal tidligere spørgsmål/svar i flowet)
- questions_target_min = 3
- questions_target_max = 5
- direct_modality (null eller {id,label})

FLOW
A) Hvis direct_modality ikke er null:
- Giv et kort, konkret overblik om den modalitet:
  - Hvad det typisk er
  - Hvad det ofte bruges til
  - Evidensnote (kort)
  - Sikkerhed/forbehold (kort)
  - Hvad man kan kigge efter hos behandler
- Tilføj 1–2 sætninger: hvor hypnoterapi typisk kan supplere (eller ikke er førstevalg) ift. user_input.
- Slut med: “Vil du dykke mere ned i [modalitet], eller vil du høre et samlet hypno+plus forslag?”

B) Ellers (spørgsmål-flow):
- Stil ét spørgsmål ad gangen.
- Spørgsmål 1–3 er obligatoriske.
- Efter 3 svar: hvis du har nok info, anbefal.
- Hvis du mangler afgørende info, stil spørgsmål 4 (og evt 5).
- Når du anbefaler:
  1) 1 sætning der opsummerer brugerens mål/udfordring.
  2) “Mulige veje (hypno+plus):” med 3–4 bullets:
     - Hypnoterapi: (altid med) 1 linje om relevans/begrænsning ift. user_input + (evidens: ...)
     - 2–3 andre fra listen, hver med 1 linje begrundelse + (evidens: ...)
  3) “Mit forslag til næste skridt:” 1–2 sætninger (inkl. evt “få tjekket først”).
  4) Spørg: “Hvilken vil du høre mere om?” og giv 2–4 chips-forslag (må gerne inkludere “Hypnoterapi”).

SPØRGSMÅL (brug i rækkefølge)
Q1 (question_count==0):
- “Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?”
Q2 (question_count==1):
- “Hvilken type problem fylder mest: smerte/krop, stress/uro, søvn/energi, fordøjelse, vane/adfærd, eller noget andet?”
Q3 (question_count==2):
- “Hvad har du allerede prøvet, og hvad virkede lidt (selv hvis det var kortvarigt)?”
Q4 (valgfri):
- “Er der noget du vil undgå (fx nåle, berøring, øvelser hjemme, kosttilskud), eller noget du foretrækker?”
Q5 (valgfri):
- “Er der tegn der bør tjekkes sundhedsfagligt først (fx nye symptomer, stærke smerter, feber, blod, udtalt vægttab) – eller er det allerede undersøgt?”

SARKASME
Hvis brugeren er sarkastisk/nedladende: svar kort, venligt, nudge tilbage til næste konkrete spørgsmål og slut med 🙂

OUTPUT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "summary": string (optional),
  "close_signal": boolean (optional),
  "confidence": number (optional),
  "relevance": number (optional),
  "tags": string[] (optional),
  "next_question": string (optional),
  "questions_remaining": number (optional),
  "chips": [{ "id": string, "label": string }] (optional)
}

- close_signal: true når du er i anbefalingsfasen (ikke når du spørger).
- chips: brug til at foreslå 2–4 ting at dykke ned i.
`

function buildFallbackQuestion(questionCount: number, userText: string): Output {
  const u = (userText ?? "").trim()
  const q =
    questionCount <= 0
      ? "Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?"
      : questionCount === 1
        ? "Hvilken type problem fylder mest: smerte/krop, stress/uro, søvn/energi, fordøjelse, vane/adfærd, eller noget andet?"
        : questionCount === 2
          ? "Hvad har du allerede prøvet, og hvad virkede lidt (selv hvis det var kortvarigt)?"
          : questionCount === 3
            ? "Er der noget du vil undgå (fx nåle, berøring, øvelser hjemme, kosttilskud), eller noget du foretrækker?"
            : "Er der tegn der bør tjekkes sundhedsfagligt først (fx nye symptomer, stærke smerter, feber, blod, udtalt vægttab) – eller er det allerede undersøgt?"

  return {
    assistant_message: u
      ? `Okay—${u}. For at pege på et samlet hypno+plus forslag har jeg lige ét spørgsmål: ${q}`
      : `For at pege på et samlet hypno+plus forslag har jeg lige ét spørgsmål: ${q}`,
    next_question: q,
    questions_remaining: Math.max(0, 5 - Math.max(0, questionCount)),
    summary: `asking: Q${Math.min(questionCount + 1, 5)}`,
  }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const userText = (context.userText ?? "").trim()
    const direct = detectDirectModalityQuestion(userText)

    // Brug whitelisted counter hvis den findes, ellers beregn fra transcript.
    const metaCount = getQuestionCountFromMeta(context)
    const questionCount = metaCount ?? computeQuestionCountFromTranscript(transcript)

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
            question_count: questionCount,
            questions_target_min: 3,
            questions_target_max: 5,
            direct_modality: direct,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response) ?? buildFallbackQuestion(questionCount, userText)

    const updatedTranscript = appendTranscript(transcript, userText, parsed.assistant_message)

    // IMPORTANT: skriv kun meta-keys der er whitelisted i METHOD_FIT.meta_domains_written
    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
    }

    meta_delta["method_fit.question_count"] = direct ? questionCount : Math.min(questionCount + 1, 99)

    if (typeof parsed.questions_remaining === "number") meta_delta["method_fit.questions_remaining"] = parsed.questions_remaining
    if (typeof parsed.next_question === "string" && parsed.next_question.trim())
      meta_delta["method_fit.next_question"] = parsed.next_question.trim()
    if (typeof parsed.close_signal === "boolean") meta_delta["method_fit.close_signal"] = parsed.close_signal
    if (typeof parsed.relevance === "number") meta_delta["method_fit.relevance"] = parsed.relevance
    if (typeof parsed.confidence === "number") meta_delta["method_fit.confidence"] = parsed.confidence
    if (Array.isArray(parsed.tags) && parsed.tags.length) meta_delta["method_fit.tags"] = parsed.tags
    if (Array.isArray(parsed.chips) && parsed.chips.length) meta_delta["method_fit.chips"] = parsed.chips
    if (typeof parsed.summary === "string" && parsed.summary.trim()) meta_delta["method_fit.summary"] = parsed.summary.trim()

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
        capability: "method-fit-v1",
        used_fallback: !response,
      },
    }
  },
}
