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

type FocusedReflectionReadiness = {
  eligible: boolean
  reason:
    | "explicit_reflection_intent"
    | "repeated_personal_theme"
    | "insufficient_turns"
    | "information_question_only"
    | "topic_not_established"
}

const MAX_TRANSCRIPT_TURNS = 30
const MAX_TRANSCRIPT_CHARS = 6000

const FOCUSED_REFLECTION_OFFER =
  "Hvis du senere vil, kan vi også skifte til et mere fokuseret refleksionsspor om dit forhold til alkohol. " +
  "Der kan vi undersøge mønstre og triggere mere systematisk. " +
  "Skriv fx 'skift spor' hvis du vil det."

const GEN_HYPNO_PROMPT = `
ROLLE
Du er en rolig, kompetent hypnoterapeutisk informations- og afklaringsassistent.

PRIMÆR FUNKTION
Du giver:
- kort og nøgtern information om hypnoterapi
- afklaring af hvordan et forløb typisk foregår
- overblik over metode, anvendelse og evidens
- rolig afgrænsning af næste relevante emne

DU GØR IKKE
- behandling
- egentlig terapeutisk proces
- dyb personlig udforskning
- refleksionsdialog om triggere, mønstre, konflikter eller følelser
- spørgsmål der inviterer til selvudforskning på et terapeutisk niveau

SAMTALESTRUKTUR
Du modtager:
- conversation_transcript
- user_input
- assistant_turn_count

INTERN VURDERING FØR SVAR
Vurder kort:
- Er brugerens hensigt primært information, evidens, forløb, relevans eller kontakt?
- Er spørgsmålet konkret eller bredt?
- Skal svaret være forklarende, afgrænsende eller orienterende?
- Er brugeren ved at søge personlig refleksion? Hvis ja, så bliv stadig i den generelle informationsrolle.

HÅRD AFGRÆNSNING
Hvis brugeren beskriver alkoholforbrug eller ønsker bedre selvforståelse:
- forklar kun generelt hvordan hypnoterapi typisk kan arbejde med vaner, automatreaktioner og opmærksomhed
- du må IKKE gå ind i konkret udforskning af brugerens egne triggere, følelser, mønstre eller underliggende årsager
- du må IKKE stille spørgsmål som undersøger brugerens indre tilstand eller specifikke situationer
- du må IKKE opføre dig som om et fokuseret refleksionsspor allerede er aktivt

TILLADTE SPØRGSMÅL
Du må højst stille ét spørgsmål, og kun hvis det hjælper med at afgrænse informationsbehov.
Gode spørgsmål er fx:
- "Vil du helst høre om hvordan et forløb typisk foregår, eller om hvordan metoden bruges ved vaner?"
- "Vil du helst høre om evidens eller om den praktiske form?"
Undgå spørgsmål om:
- bestemte følelser
- svære situationer
- konkrete triggere
- hvorfor brugeren gør noget
- hvad der ligger bag et mønster

SVARSTIL
- rolig
- klar
- professionel
- nøgtern
- kort til moderat længde
- ingen terapeutisk tone
- ingen følelsesudforskning
- ingen formuleringer der lyder som guidet selvindsigt

VED KONKRETE SPØRGSMÅL
- svar direkte først
- tilføj højst lidt nødvendig kontekst
- stil kun ét afgrænsende spørgsmål hvis det faktisk hjælper

VED BREDERE INPUT
- afgræns nænsomt
- giv et kort overblik
- peg på 1 næste relevant retning

OPSUMMERINGSREGEL
- Hvis assistant_turn_count > 0 OG assistant_turn_count % 4 === 0:
  Giv en kort, struktureret opsummering før du går videre.
- Afslut med højst ét konkret informationsspørgsmål.

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

KONTAKT / BOOKING
Hvis brugeren vil i kontakt, spørger til Jan, booking, telefon eller mail:
- svar kort og praktisk
- hold fokus på kontaktinformation og næste konkrete skridt
- skift ikke til refleksionsspor

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

  return "Tak for dit spørgsmål. Vil du helst høre om metoden, evidensen eller hvordan et forløb typisk foregår?"
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function stripPunctuation(text: string): string {
  return normalizeText(text).replace(/[.,!?;:()"'’“”‘’\\-]/g, " ")
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

function countUserTurns(turns: TranscriptTurn[]): number {
  return turns.filter((turn) => turn.role === "user").length
}

function countTopicMatches(
  turns: TranscriptTurn[],
  matcher: (text: string) => boolean
): number {
  return turns.filter((turn) => turn.role === "user" && matcher(turn.content)).length
}

function hasReflectionIntent(text: string): boolean {
  const t = stripPunctuation(text)

  const phrases = [
    "refleksion",
    "reflektere",
    "forstå mit mønster",
    "forstå mine mønstre",
    "forstå hvorfor",
    "undersøge mønster",
    "undersøge mine mønstre",
    "mit forhold til alkohol",
    "triggere",
    "hvad der trækker i mig",
    "forstå mig selv bedre",
  ]

  return phrases.some((phrase) => t.includes(phrase))
}

function isLikelyConcreteInfoQuestion(text: string): boolean {
  const t = stripPunctuation(text)

  const phrases = [
    "kan du hjælpe",
    "kan hypnoterapi hjælpe",
    "kan hypnose hjælpe",
    "hvordan virker",
    "hvad er hypnoterapi",
    "hvordan foregår",
    "hvordan et forløb foregår",
    "virker det",
    "hjælper det",
    "hvordan kan det virke",
    "vil gerne have hjælp og forstå hvordan det kan virke",
    "hvordan bruges det",
  ]

  if (phrases.some((phrase) => t.includes(phrase))) return true

  return text.trim().endsWith("?")
}

function shouldOfferFocusedReflection(params: {
  transcript: TranscriptTurn[]
  userText: string
  assistantTurnCount: number
}): FocusedReflectionReadiness {
  const userTurnsBefore = countUserTurns(params.transcript)
  const topicHitsBefore = countTopicMatches(params.transcript, isAlcoholTopic)
  const currentIsAlcoholTopic = isAlcoholTopic(params.userText)
  const topicHitsTotal = topicHitsBefore + (currentIsAlcoholTopic ? 1 : 0)

  if (!currentIsAlcoholTopic && topicHitsTotal < 2) {
    return { eligible: false, reason: "topic_not_established" }
  }

  if (hasReflectionIntent(params.userText) && (currentIsAlcoholTopic || topicHitsTotal >= 1)) {
    if (params.assistantTurnCount >= 2 || topicHitsTotal >= 2) {
      return { eligible: true, reason: "explicit_reflection_intent" }
    }
    return { eligible: false, reason: "insufficient_turns" }
  }

  if (isLikelyConcreteInfoQuestion(params.userText) && userTurnsBefore < 2) {
    return { eligible: false, reason: "information_question_only" }
  }

  if (topicHitsTotal < 2) {
    return { eligible: false, reason: "topic_not_established" }
  }

  if (params.assistantTurnCount < 2) {
    return { eligible: false, reason: "insufficient_turns" }
  }

  return { eligible: true, reason: "repeated_personal_theme" }
}

function isFocusedReflectionOffer(turn: TranscriptTurn | undefined): boolean {
  if (!turn || turn.role !== "assistant") return false
  return (
    turn.content.includes("mere fokuseret refleksionsspor om dit forhold til alkohol") ||
    turn.content.includes("skifte til et mere fokuseret refleksionsspor om dit forhold til alkohol")
  )
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
    (t.includes("generel") && t.includes("spor"))
  ) {
    return true
  }

  return false
}

function buildFocusedReflectionTranscript(
  previous: TranscriptTurn[],
  userText: string
): TranscriptTurn[] {
  const base = previous
    .filter((turn) => !(turn.role === "assistant" && isFocusedReflectionOffer(turn)))
    .slice(-8)

  const transcript: TranscriptTurn[] = [...base]
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
          "Fint. Vi skifter til et mere fokuseret refleksionsspor om dit forhold til alkohol. Her kan vi undersøge mønstre og triggere mere systematisk, uden at gøre det til behandling i chatten.",
        meta_delta: {
          "focused_reflection.topic": "alkohol",
          "focused_reflection.entry_source": "GEN_HYPNO",
          "focused_reflection.user_opt_in": true,
          "focused_reflection.stage": "OPEN",
          "focused_reflection.transcript": buildFocusedReflectionTranscript(fullTranscript, userText),
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
        "Fint. Vi bliver i det generelle spor. Vil du helst høre mere om, hvordan hypnoterapi typisk bruges ved alkoholvaner, eller om hvordan et forløb praktisk foregår?"

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
          "gen_hypno.topic_tags": ["alkohol", "information"],
          "focused_reflection.readiness": "information_question_only",
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
      temperature: 0.3,
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

    let assistant =
      parsed?.assistant_message ??
      buildFallbackMessage(userText)

    const readiness = shouldOfferFocusedReflection({
      transcript: fullTranscript,
      userText,
      assistantTurnCount: previousAssistantCount,
    })

    if (readiness.eligible) {
      assistant = `${assistant}\n\n${FOCUSED_REFLECTION_OFFER}`
    }

    const updatedTranscript = appendTranscript(
      fullTranscript,
      userText,
      assistant
    )

    const newAssistantCount = previousAssistantCount + 1

    const meta_delta: Record<string, unknown> = {
      "gen_hypno.transcript": updatedTranscript,
      "gen_hypno.assistant_turn_count": newAssistantCount,
      "focused_reflection.readiness": readiness.reason,
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
      reason: readiness.eligible
        ? "gen-hypno-free-text-with-focused-reflection-offer"
        : "gen-hypno-free-text",
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
