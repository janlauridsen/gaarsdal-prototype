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

type DialogMode =
  | "informational"
  | "guided_reflection"
  | "evidence"
  | "practical"
  | "closing"

type ReadinessReason =
  | "explicit_reflection_intent"
  | "repeated_personal_theme"
  | "information_question_only"
  | "topic_not_established"
  | "closing_signal"
  | "general"

type UnifiedRunOptions = {
  transcriptKey: string
  sourceNode: string
  stayOnNode: string
  forcedMode?: Exclude<DialogMode, "closing">
}

type ReflectionContext = {
  isActive: boolean
  topic?: string
  transcript: TranscriptTurn[]
  stage?: string
}

const MAX_TRANSCRIPT_TURNS = 30
const MAX_TRANSCRIPT_CHARS = 6000

const HYPNO_CONVERSATION_PROMPT = `
ROLLE
Du er en rolig, klar og nøgtern samtalepartner om hypnoterapi, vaneændring og mønsterforståelse.

RAMME
Du må gerne:
- forklare hypnoterapi og hvordan et forløb typisk foregår
- svare nøgternt om evidens og praktisk anvendelse
- hjælpe brugeren med let, ikke-klinisk refleksion om vaner, mønstre og triggere

Du må ikke:
- diagnosticere
- love effekt
- opføre dig som om chatten er behandling
- presse brugeren ind i dyb terapi eller intens følelsesudforskning

STIL
- svar direkte på det vigtigste først
- hold tonen rolig, enkel og professionel
- ved refleksion: højst ét fokuseret spørgsmål
- ved information: højst ét afgrænsende spørgsmål
- undgå lange taler og gentagelser

MODES
1) informational
   Bruges når brugeren vil forstå metode, forløb eller generel relevans.

2) evidence
   Bruges når brugeren spørger om effekt, dokumentation eller om det virker.
   Skeln tydeligt mellem evidens og klinisk erfaring.

3) practical
   Bruges ved kontakt, booking, pris, adresse, telefon, mail eller praktiske næste skridt.

4) guided_reflection
   Bruges når brugeren tydeligt vil forstå egne mønstre, vaner eller triggere.
   Det er stadig ikke terapi. Hjælp med rolig, let struktur:
   - anerkend temaet kort
   - giv 1-3 konkrete observationsvinkler
   - stil højst ét enkelt spørgsmål, som hjælper brugeren med at lægge mærke til mønstre
   Undgå tung terapeutisk tone.

5) closing
   Bruges ved korte sociale lukninger som "tak".
   Svar meget kort. Gentag ikke en fuld afslutning.

ALKOHOL / VANER
Når brugeren taler om alkohol eller vaner:
- du må gerne tale om mønstre, situationer, automatreaktioner og typiske triggere på et let, konkret niveau
- du må ikke diagnosticere afhængighed eller lave behandlingsplan
- du må gerne foreslå observationer i hverdagen frem for tolkninger af dybe årsager

EVIDENSRAMME
(A) God evidens: flere systematiske reviews/metaanalyser
(B) Moderat/blandet evidens: mindre RCT'er eller blandede resultater
(C) Begrænset evidens: få studier eller metodiske begrænsninger
(D) Primært klinisk erfaring
Hvis uklart: skriv "evidens: uklar"

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

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function stripPunctuation(text: string): string {
  return normalizeText(text).replace(/[.,!?;:()"'\u2019\u201c\u201d\u2018\\/-]/g, " ")
}

function readTranscriptByKey(
  context: AiCapabilityContext,
  key: string
): TranscriptTurn[] {
  const raw = context.state.meta[key]?.value
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

function readStringMeta(context: AiCapabilityContext, key: string): string | undefined {
  const value = context.state.meta[key]?.value
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function readBooleanMeta(context: AiCapabilityContext, key: string): boolean {
  return context.state.meta[key]?.value === true
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

  const u = userText.trim()
  const a = assistantText.trim()

  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })

  return next
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null

  const assistant_message =
    typeof raw.assistant_message === "string"
      ? raw.assistant_message.trim()
      : ""

  if (!assistant_message) return null

  const last_topic =
    typeof raw.last_topic === "string" ? raw.last_topic.trim() : undefined

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
    assistant_message,
    last_topic,
    problem_title,
    problem_summary,
    topic_tags,
  }
}

function countAssistantTurns(turns: TranscriptTurn[]): number {
  return turns.filter((turn) => turn.role === "assistant").length
}

function countTopicMatches(
  turns: TranscriptTurn[],
  matcher: (text: string) => boolean
): number {
  return turns.filter((turn) => turn.role === "user" && matcher(turn.content)).length
}

function isAlcoholTopic(text: string): boolean {
  const t = stripPunctuation(text)

  const patterns = [
    "alkohol",
    "alkoholforbrug",
    "drikker for meget",
    "mit drikkeri",
    "vin hver aften",
    "øl hver aften",
    "mit forhold til alkohol",
    "stoppe med at drikke",
    "skære ned på alkohol",
    "rødvin",
    "rodvin",
    "hvidvin",
    "vin",
    "øl",
    "oel",
    "druk",
    "drikke",
    "drikker",
    "glas vin",
  ]

  return patterns.some((pattern) => t.includes(pattern))
}

function hasReflectionIntent(text: string): boolean {
  const t = stripPunctuation(text)

  const phrases = [
    "refleksion",
    "reflektere",
    "selvindsigt",
    "forstå mine mønstre",
    "forstå mit mønster",
    "forstå hvorfor",
    "triggere",
    "forstå mig selv bedre",
    "hvad der sker i mig",
    "undersøge mine vaner",
    "forhold til alkohol",
  ]

  return phrases.some((phrase) => t.includes(phrase))
}

function isEvidenceQuestion(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "virker det",
    "hjælper det",
    "evidens",
    "dokumentation",
    "dokumenteret",
    "forskning",
    "studier",
  ].some((phrase) => t.includes(phrase))
}

function isPracticalIntent(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "booking",
    "booke",
    "kontakt",
    "telefon",
    "mail",
    "email",
    "e mail",
    "adresse",
    "pris",
    "priser",
    "jan",
  ].some((phrase) => t.includes(phrase))
}

function isSoftClosing(text: string): boolean {
  const t = normalizeText(text)
  return ["tak", "mange tak", "super", "fint", "okay tak", "ok tak", "selv tak"].includes(t)
}

function isHardExit(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "stop",
    "afslut",
    "slut",
    "tilbage",
    "hjem",
    "home",
    "menu",
    "hovedmenu",
    "ikke nu",
  ].some((phrase) => t === phrase || t.includes(phrase))
}

function hasActiveReflectionContext(context: AiCapabilityContext): ReflectionContext {
  const transcript = readTranscriptByKey(context, "focused_reflection.transcript")
  const userOptIn = readBooleanMeta(context, "focused_reflection.user_opt_in")
  const mode = readStringMeta(context, "dialog.mode")
  const stage = readStringMeta(context, "focused_reflection.stage")
  const topic =
    readStringMeta(context, "focused_reflection.topic") ||
    readStringMeta(context, "dialog.topic") ||
    readStringMeta(context, "gen_hypno.last_topic")

  return {
    isActive: userOptIn || mode === "guided_reflection" || transcript.length > 0,
    topic,
    transcript,
    stage,
  }
}

function isReflectionFollowUp(text: string): boolean {
  const t = stripPunctuation(text)

  if (!t) return false

  return [
    "når",
    "typisk",
    "ofte",
    "især",
    "saerligt",
    "jeg får lyst",
    "jeg faar lyst",
    "efter arbejde",
    "om aftenen",
    "hen på ugen",
    "hen paa ugen",
    "jeg bliver træt",
    "jeg bliver traet",
    "når jeg er træt",
    "naar jeg er traet",
    "det sker når",
    "det sker naar",
    "i weekenden",
    "hjemme",
    "socialt",
    "automatisk",
    "rutine",
    "vane",
    "trang",
    "trigger",
    "følelse",
    "foelelse",
  ].some((phrase) => t.includes(phrase))
}

function inferReadiness(params: {
  transcript: TranscriptTurn[]
  userText: string
  reflectionContext: ReflectionContext
}): ReadinessReason {
  const { transcript, userText, reflectionContext } = params

  if (isSoftClosing(userText)) return "closing_signal"
  if (hasReflectionIntent(userText)) return "explicit_reflection_intent"

  const currentAlcohol = isAlcoholTopic(userText)
  const topicHitsBefore = countTopicMatches(transcript, isAlcoholTopic)
  const topicHitsTotal = topicHitsBefore + (currentAlcohol ? 1 : 0)

  if (currentAlcohol && topicHitsTotal >= 2) return "repeated_personal_theme"
  if (isEvidenceQuestion(userText)) return "information_question_only"

  if (reflectionContext.isActive && (currentAlcohol || isReflectionFollowUp(userText))) {
    return "repeated_personal_theme"
  }

  if (!currentAlcohol && topicHitsTotal < 2) return "topic_not_established"

  return "general"
}

function decideMode(params: {
  context: AiCapabilityContext
  transcript: TranscriptTurn[]
  userText: string
  forcedMode?: Exclude<DialogMode, "closing">
  reflectionContext: ReflectionContext
}): { mode: DialogMode; readiness: ReadinessReason } {
  const readiness = inferReadiness({
    transcript: params.transcript,
    userText: params.userText,
    reflectionContext: params.reflectionContext,
  })

  if (params.forcedMode) {
    return {
      mode: readiness === "closing_signal" ? "closing" : params.forcedMode,
      readiness,
    }
  }

  if (readiness === "closing_signal") return { mode: "closing", readiness }
  if (isPracticalIntent(params.userText)) return { mode: "practical", readiness }
  if (isEvidenceQuestion(params.userText)) return { mode: "evidence", readiness }

  if (
    readiness === "explicit_reflection_intent" ||
    readiness === "repeated_personal_theme"
  ) {
    return { mode: "guided_reflection", readiness }
  }

  if (params.reflectionContext.isActive && isReflectionFollowUp(params.userText)) {
    return { mode: "guided_reflection", readiness: "repeated_personal_theme" }
  }

  return { mode: "informational", readiness }
}

function extractTopic(text: string, fallback?: string): string | undefined {
  const t = stripPunctuation(text)

  if (t.includes("alkohol") || t.includes("rødvin") || t.includes("rodvin") || t.includes("vin")) return "alkohol"
  if (t.includes("vaner") || t.includes("vane")) return "vaner"
  if (t.includes("søvn") || t.includes("soevn")) return "søvn"
  if (t.includes("stress")) return "stress"
  if (t.includes("angst")) return "angst"

  return fallback && fallback.trim() ? fallback.trim() : undefined
}

function buildClosingMessage(transcript: TranscriptTurn[]): string {
  const lastAssistant = [...transcript].reverse().find((turn) => turn.role === "assistant")
  if (!lastAssistant) return "Selv tak."
  if (/^selv tak[.!]?$/i.test(lastAssistant.content.trim())) return "Det var så lidt."
  return "Selv tak."
}

function buildFallbackMessage(params: {
  mode: DialogMode
  transcript: TranscriptTurn[]
}): string {
  if (params.mode === "closing") {
    return buildClosingMessage(params.transcript)
  }

  if (params.mode === "practical") {
    return (
      "Du kan kontakte Jan på +45 42 80 74 74 eller jan@gaarsdal.net. " +
      "Klinikken ligger på Bakkevej 36, 3460 Birkerød."
    )
  }

  if (params.mode === "evidence") {
    return (
      "Hypnoterapi kan støtte vaneændring, men evidensen specifikt for alkoholproblemer er begrænset og blandet (evidensniveau C). " +
      "Det giver mest mening som supplement i en bredere indsats frem for som eneste løsning."
    )
  }

  if (params.mode === "guided_reflection") {
    return (
      "Når alkohol bliver en vane, hænger det ofte sammen med bestemte situationer, tidspunkter eller skift i energi og uro. " +
      "Et enkelt sted at starte er at lægge mærke til, om trangen typisk kommer efter belastning, i overgange på dagen eller som en fast aftenrutine. " +
      "Hvornår på dagen lægger du oftest mærke til mønsteret?"
    )
  }

  return (
    "Hypnoterapi bruges ofte til at arbejde med vaner, automatiske reaktioner og opmærksomhed. " +
    "Jeg kan enten forklare, hvordan et typisk forløb foregår, eller hvordan metoden typisk bruges ved vaneændring."
  )
}

function buildMetaDelta(params: {
  context: AiCapabilityContext
  assistantMessage: string
  updatedTranscript: TranscriptTurn[]
  mode: DialogMode
  readiness: ReadinessReason
  parsed: Output | null
  topic: string | undefined
  sourceNode: string
  transcriptKey: string
  reflectionContext: ReflectionContext
}): Record<string, unknown> {
  const previousTranscript = readTranscriptByKey(params.context, params.transcriptKey)
  const previousAssistantCount = countAssistantTurns(previousTranscript)
  const nextAssistantCount = params.assistantMessage
    ? previousAssistantCount + 1
    : previousAssistantCount

  const reflectionActive =
    params.mode === "guided_reflection" ||
    params.reflectionContext.isActive

  const dialogMode: DialogMode =
    reflectionActive && params.mode === "informational"
      ? "guided_reflection"
      : params.mode

  const dialogStage =
    dialogMode === "closing"
      ? "close"
      : dialogMode === "guided_reflection"
        ? "explore_patterns"
        : "open"

  const effectiveReadiness: ReadinessReason =
    reflectionActive && params.readiness === "topic_not_established"
      ? "repeated_personal_theme"
      : params.readiness

  const meta: Record<string, unknown> = {
    [params.transcriptKey]: params.updatedTranscript,
    "gen_hypno.transcript": params.updatedTranscript,
    "gen_hypno.assistant_turn_count": nextAssistantCount,
    "focused_reflection.readiness": effectiveReadiness,
    "dialog.mode": dialogMode,
    "dialog.stage": dialogStage,
  }

  if (params.topic) {
    meta["gen_hypno.last_topic"] = params.topic
    meta["focused_reflection.topic"] = params.topic
    meta["dialog.topic"] = params.topic
  }

  if (reflectionActive) {
    meta["focused_reflection.entry_source"] =
      readStringMeta(params.context, "focused_reflection.entry_source") ||
      params.sourceNode
    meta["focused_reflection.user_opt_in"] = true
    meta["focused_reflection.stage"] = dialogMode === "closing" ? "CLOSED" : "OPEN"
    meta["focused_reflection.transcript"] = params.updatedTranscript
  }

  if (params.parsed?.problem_title) {
    meta["gen_hypno.problem_title"] = params.parsed.problem_title
  }

  if (params.parsed?.problem_summary) {
    meta["gen_hypno.problem_summary"] = params.parsed.problem_summary
  }

  if (params.parsed?.topic_tags?.length) {
    meta["gen_hypno.topic_tags"] = params.parsed.topic_tags
  }

  if (
    params.topic === "alkohol" &&
    !params.parsed?.problem_title &&
    !params.context.state.meta["gen_hypno.problem_title"]?.value
  ) {
    meta["gen_hypno.problem_title"] = "alkoholvaner"
    meta["gen_hypno.problem_summary"] =
      "Ønske om at forstå eller ændre alkoholvaner."
    meta["gen_hypno.topic_tags"] = ["alkohol", "vaner", "hypnoterapi"]
  }

  return meta
}

export async function runUnifiedHypnoCapability(
  context: AiCapabilityContext,
  llm: LlmClient,
  options: UnifiedRunOptions
): Promise<AiCapabilityResult> {
  const transcript = readTranscriptByKey(context, options.transcriptKey)
  const trimmedTranscript = trimTranscript(transcript)
  const userText = context.userText ?? ""
  const reflectionContext = hasActiveReflectionContext(context)

  const previousTopic =
    readStringMeta(context, "gen_hypno.last_topic") ||
    reflectionContext.topic

  if (isHardExit(userText)) {
    const assistant = "Helt fint. Vi stopper her, og du kan vende tilbage senere."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: "HOME",
      reason: "user-requested-exit",
      response_message: assistant,
      meta_delta: buildMetaDelta({
        context,
        assistantMessage: assistant,
        updatedTranscript,
        mode: "closing",
        readiness: "closing_signal",
        parsed: null,
        topic: previousTopic,
        sourceNode: options.sourceNode,
        transcriptKey: options.transcriptKey,
        reflectionContext,
      }),
    }

    return {
      transition,
      debug: {
        capability: "unified-hypno-v2",
        used_fallback: false,
      },
    }
  }

  const { mode, readiness } = decideMode({
    context,
    transcript,
    userText,
    forcedMode: options.forcedMode,
    reflectionContext,
  })

  let assistant = ""
  let parsed: Output | null = null
  let usedFallback = false

  if (mode === "closing") {
    assistant = buildClosingMessage(transcript)
  } else {
    try {
      const result = await llm.chatJson({
        model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
        temperature: mode === "guided_reflection" ? 0.45 : 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: HYPNO_CONVERSATION_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              mode,
              site_context: GAARSDAL_SITE_CONTEXT_DA,
              conversation_transcript: trimmedTranscript,
              user_input: userText,
              last_topic: previousTopic ?? "",
              reflection_active: reflectionContext.isActive,
              reflection_topic: reflectionContext.topic ?? "",
            }),
          },
        ],
      })

      parsed = normalizeOutput(result)

      if (parsed?.assistant_message) {
        assistant = parsed.assistant_message
      }
    } catch {
      usedFallback = true
    }
  }

  if (!assistant && mode !== "closing") {
    assistant = buildFallbackMessage({ mode, transcript })
    usedFallback = true
  }

  const updatedTranscript = appendTranscript(transcript, userText, assistant)
  const topic = parsed?.last_topic || extractTopic(userText, previousTopic)

  const transition: Transition = {
    type: "NODE_HOP",
    from: context.state.active_node,
    to: options.stayOnNode,
    reason: `unified-hypno:${mode}`,
    response_message: assistant,
    meta_delta: buildMetaDelta({
      context,
      assistantMessage: assistant,
      updatedTranscript,
      mode,
      readiness,
      parsed,
      topic,
      sourceNode: options.sourceNode,
      transcriptKey: options.transcriptKey,
      reflectionContext,
    }),
  }

  return {
    transition,
    debug: {
      capability: "unified-hypno-v2",
      used_fallback: usedFallback,
    },
  }
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",

  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    return runUnifiedHypnoCapability(context, llm, {
      transcriptKey: "gen_hypno.transcript",
      sourceNode: "GEN_HYPNO",
      stayOnNode: "GEN_HYPNO",
    })
  },
}

export default genHypnoCapability
