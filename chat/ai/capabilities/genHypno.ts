import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmClient,
} from "../types"
import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  last_topic?: string
  problem_title?: string
  problem_summary?: string
  topic_tags?: string[]
}

const MAX_TRANSCRIPT_TURNS = 30
const MAX_TRANSCRIPT_CHARS = 6000

const FOCUSED_REFLECTION_OFFER =
  "Tak for din åbenhed. Vi kan godt fortsætte her i chatten på to måder:\n\n" +
  "1. Fortsætte som nu med generel refleksion og information\n" +
  "2. Skifte til et mere fokuseret refleksionsspor om dit forhold til alkohol\n\n" +
  "Skriv fx 1, 2, 'fortsæt som nu' eller 'skift spor'."

const GEN_HYPNO_PROMPT = `
ROLLE
Du er en rolig, kompetent hypnoterapeut.

SAMTALESTRUKTUR
Du modtager:
- conversation_transcript
- user_input
- assistant_turn_count

INTERN ARBEJDSMÅDE
Før du svarer, vurder kort:
- Hvad er brugerens primære hensigt? (fx information, evidens, forløb, bekymring, refleksion)
- Er input konkret eller uklart?
- Er der tegn på et specifikt problem eller tema?
- Er der forhold der kræver afgrænsning?

Tilpas svaret derefter:
- Ved konkrete spørgsmål: svar kort og præcist.
- Ved uklare eller brede spørgsmål: afgræns og stil højst ét konkret spørgsmål.
- Ved personlige eller følelsesmæssigt tunge input: svar roligt, neutralt og uden at gå ind i behandling.
- Hvis brugeren beskriver alkoholforbrug som et personligt tema, hold dig i denne node til kort afgrænsning og information. Du må ikke selv flytte brugeren til et andet spor; det håndteres udenfor denne prompt.

OPSUMMERINGSREGEL
- Hvis assistant_turn_count > 0 OG assistant_turn_count % 4 === 0:
  Giv en kort, struktureret opsummering før du går videre.
- Afslut med højst ét konkret spørgsmål.

EVIDENSRAMME
(A) God evidens: Flere systematiske reviews eller metaanalyser.
(B) Moderat/blandet evidens: Mindre RCT'er eller blandede resultater.
(C) Begrænset evidens: Få studier eller metodiske begrænsninger.
(D) Primært klinisk erfaring.
Hvis uklart: skriv "evidens: uklar".

EVIDENSFORMIDLING
- Når brugeren spørger til effekt eller dokumentation, svar nøgternt og kort.
- Skeln tydeligt mellem evidensniveau og klinisk erfaring.
- Undgå sikre løfter eller overdrivelser.

AFGRÆNSNING
- Du behandler ikke, lover ikke noget og kan ikke booke eller lave andre aftaler.
- Gå ikke ind i egentlig terapeutisk proces i denne samtale.
- Hvis brugeren ønsker dybt udforskende, personlig bearbejdning, hold svaret kort og neutralt.

SVARSTIL
- Svar roligt, klart og professionelt.
- Brug gerne en kort, neutral spejling af brugerens emne eller bekymring, men uden at gå ind i terapi.
- Hold fokus på information, afklaring og næste relevante skridt.

SPØRGSMÅL
- Stil kun spørgsmål hvis det hjælper med at afgrænse brugerens behov eller næste relevante emne.
- Stil højst ét konkret spørgsmål.
- Undgå åbne terapeutiske eller dybt udforskende spørgsmål.

LAST_TOPIC
- 1–2 ord
- små bogstaver
- generelt og stabilt
- genbrug hvis muligt

PROBLEM_CAPTURE
- Hvis brugerens input beskriver et konkret problem eller tema, udfyld også:
  - "problem_title": 1-4 ord
  - "problem_summary": 1 kort sætning, neutral og præcis
  - "topic_tags": liste med 1-3 korte tags i små bogstaver
- Udelad felterne hvis problemet ikke er konkret nok endnu.

OUTPUT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "last_topic": string (optional),
  "problem_title": string (optional),
  "problem_summary": string (optional),
  "topic_tags": string[] (optional)
}
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
  if (!Array.isArray(raw)) return []

  const turns: TranscriptTurn[] = []

  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any

    if (
      (obj.role === "user" || obj.role === "assistant") &&
      typeof obj.content === "string"
    ) {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }

  return turns
}

function trimTranscript(turns: TranscriptTurn[]): TranscriptTurn[] {
  const cappedByTurn = turns.slice(-MAX_TRANSCRIPT_TURNS)

  const result: TranscriptTurn[] = []
  let totalChars = 0

  for (let i = cappedByTurn.length - 1; i >= 0; i--) {
    const len = cappedByTurn[i].content.length
    if (totalChars + len > MAX_TRANSCRIPT_CHARS) break
    result.unshift(cappedByTurn[i])
    totalChars += len
  }

  return result
}

function appendTranscript(
  previous: TranscriptTurn[],
  userText: string,
  assistantText: string
): TranscriptTurn[] {
  const next = [...previous]

  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()

  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })

  return next
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null

  const msg =
    typeof raw.assistant_message === "string"
      ? raw.assistant_message.trim()
      : ""

  if (!msg) return null

  const last_topic =
    typeof raw.last_topic === "string"
      ? raw.last_topic.trim()
      : undefined

  const problem_title =
    typeof raw.problem_title === "string"
      ? raw.problem_title.trim()
      : undefined

  const problem_summary =
    typeof raw.problem_summary === "string"
      ? raw.problem_summary.trim()
      : undefined

  const topic_tags = Array.isArray(raw.topic_tags)
    ? raw.topic_tags
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3)
    : undefined

  return {
    assistant_message: msg,
    last_topic,
    problem_title,
    problem_summary,
    topic_tags,
  }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad vil du gerne vide om hypnoterapi?"
  }

  return "Tak for dit spørgsmål. Vil du høre mest om metoder, evidens eller hvordan et forløb typisk foregår?"
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function stripPunctuation(text: string): string {
  return normalizeText(text).replace(/[.,!?;:()"'’“-]/g, " ")
}

function isAlcoholTopic(text: string): boolean {
  const t = stripPunctuation(text)

  const patterns = [
    "alkohol",
    "alkoholforbrug",
    "mit forbrug af alkohol",
    "drikker for meget",
    "jeg drikker for meget",
    "drikker lidt for meget",
    "mit drikkeri",
    "drikkeri",
    "vin hver aften",
    "øl hver aften",
    "for meget vin",
    "for mange øl",
    "mit forhold til alkohol",
    "stoppe med at drikke",
    "skære ned på alkohol",
  ]

  return patterns.some((pattern) => t.includes(pattern))
}

function isFocusedReflectionOffer(turn: TranscriptTurn | undefined): boolean {
  if (!turn || turn.role !== "assistant") return false
  return turn.content.includes("Skifte til et mere fokuseret refleksionsspor om dit forhold til alkohol")
}

function isAcceptFocusedReflection(text: string): boolean {
  const t = stripPunctuation(text)

  const exact = new Set([
    "2",
    "ja",
    "ja tak",
    "ok",
    "okay",
    "yes",
    "skift spor",
    "mere fokuseret",
    "fokuseret refleksionsspor",
    "lad os gøre det",
    "ja lad os gøre det",
    "ja skift spor",
    "ja mere fokuseret",
    "skift til spor 2",
    "spor 2",
  ])

  if (exact.has(t)) return true

  if (
    (t.includes("skift") && t.includes("spor")) ||
    (t.includes("mere") && t.includes("fokuseret")) ||
    (t.includes("fokuseret") && t.includes("alkohol")) ||
    (t.includes("ja") && t.includes("spor")) ||
    (t.includes("ja") && t.includes("fokuseret"))
  ) {
    return true
  }

  return false
}

function isDeclineFocusedReflection(text: string): boolean {
  const t = stripPunctuation(text)

  const exact = new Set([
    "1",
    "fortsæt",
    "fortsæt som nu",
    "som nu",
    "bliv her",
    "nej",
    "nej tak",
  ])

  if (exact.has(t)) return true

  if (
    (t.includes("fortsæt") && t.includes("nu")) ||
    (t.includes("bliv") && t.includes("her")) ||
    (t.includes("generel") && t.includes("refleksion"))
  ) {
    return true
  }

  return false
}

function buildFocusedReflectionTranscript(userText: string): TranscriptTurn[] {
  const transcript: TranscriptTurn[] = []

  const trimmed = (userText ?? "").trim()
  if (trimmed) {
    transcript.push({ role: "user", content: trimmed })
  }

  return transcript
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",

  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    const fullTranscript = readTranscript(context)
    const trimmedTranscript = trimTranscript(fullTranscript)

    const previousAssistantCount =
      Number(context.state.meta["gen_hypno.assistant_turn_count"]?.value) || 0

    const userText = context.userText ?? ""
    const lastTurn = fullTranscript.length
      ? fullTranscript[fullTranscript.length - 1]
      : undefined

    if (isFocusedReflectionOffer(lastTurn) && isAcceptFocusedReflection(userText)) {
      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "FOCUSED_PATTERN_REFLECTION",
        reason: "gen-hypno-opt-in-focused-reflection",
        response_message:
          "Fint. Vi fortsætter her i chatten med et mere fokuseret blik på dit forhold til alkohol. Jeg hjælper dig med at undersøge mønstre, triggere og det, der trækker i dig — uden at gøre det til behandling i chatten.",
        meta_delta: {
          "focused_reflection.topic": "alcohol",
          "focused_reflection.entry_source": "GEN_HYPNO",
          "focused_reflection.user_opt_in": true,
          "focused_reflection.stage": "OPEN",
          "focused_reflection.transcript": buildFocusedReflectionTranscript(userText),
        },
      }

      return {
        transition,
        debug: {
          capability: "gen-hypno-v1",
          used_fallback: false,
        },
      }
    }

    if (isFocusedReflectionOffer(lastTurn) && isDeclineFocusedReflection(userText)) {
      const assistant =
        "Fint. Vi fortsætter som nu. Hvad vil du helst have hjælp til her: hvad hypnoterapi er, hvordan et forløb typisk foregår, eller en kort refleksion om dine alkoholvaner?"

      const updatedTranscript = appendTranscript(fullTranscript, userText, assistant)

      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "gen-hypno-decline-focused-reflection",
        response_message: assistant,
        meta_delta: {
          "gen_hypno.transcript": updatedTranscript,
          "gen_hypno.assistant_turn_count": previousAssistantCount + 1,
          "gen_hypno.last_topic": "alkohol",
          "gen_hypno.problem_title": "alkoholforbrug",
          "gen_hypno.problem_summary":
            "Brugeren ønsker at blive i den generelle dialog om alkoholforbrug.",
          "gen_hypno.topic_tags": ["alkohol", "refleksion"],
        },
      }

      return {
        transition,
        debug: {
          capability: "gen-hypno-v1",
          used_fallback: false,
        },
      }
    }

    if (isAlcoholTopic(userText)) {
      const assistant = FOCUSED_REFLECTION_OFFER
      const updatedTranscript = appendTranscript(fullTranscript, userText, assistant)

      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "gen-hypno-offer-focused-reflection",
        response_message: assistant,
        meta_delta: {
          "gen_hypno.transcript": updatedTranscript,
          "gen_hypno.assistant_turn_count": previousAssistantCount + 1,
          "gen_hypno.last_topic": "alkohol",
          "gen_hypno.problem_title": "alkoholforbrug",
          "gen_hypno.problem_summary":
            "Brugeren ønsker at tale om sit alkoholforbrug og får tilbudt et fokuseret refleksionsspor i samme chat.",
          "gen_hypno.topic_tags": ["alkohol", "forbrug", "refleksion"],
        },
      }

      return {
        transition,
        debug: {
          capability: "gen-hypno-v1",
          used_fallback: false,
        },
      }
    }

    const payload = {
      model:
        process.env.GEN_HYPNO_MODEL ??
        process.env.TRIAGE_MODEL ??
        "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        { role: "system" as const, content: GAARSDAL_SITE_CONTEXT_DA },
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: trimmedTranscript,
            user_input: userText,
            assistant_turn_count: previousAssistantCount,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)

    const assistant = parsed?.assistant_message ?? buildFallbackMessage(userText)

    const updatedTranscript = appendTranscript(fullTranscript, userText, assistant)

    const newAssistantCount = previousAssistantCount + 1

    const meta_delta: Record<string, unknown> = {
      "gen_hypno.transcript": updatedTranscript,
      "gen_hypno.assistant_turn_count": newAssistantCount,
    }

    if (parsed?.last_topic) {
      meta_delta["gen_hypno.last_topic"] = parsed.last_topic
    }
    if (parsed?.problem_title) {
      meta_delta["gen_hypno.problem_title"] = parsed.problem_title
    }
    if (parsed?.problem_summary) {
      meta_delta["gen_hypno.problem_summary"] = parsed.problem_summary
    }
    if (parsed?.topic_tags?.length) {
      meta_delta["gen_hypno.topic_tags"] = parsed.topic_tags
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "gen-hypno-free-text",
      response_message: assistant,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "gen-hypno-v1",
        used_fallback: !parsed,
      },
    }
  },
}
