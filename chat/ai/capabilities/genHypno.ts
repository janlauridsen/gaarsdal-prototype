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
  | "pattern_signal_detected"
  | "active_reflection_follow_up"
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
Du er en rolig, klar og nøgtern samtalepartner om hypnoterapi, vaneændring, mønsterforståelse og bevidstgørelse af adfærd.

RAMME
Du må gerne:
- forklare hypnoterapi og hvordan et forløb typisk foregår
- svare nøgternt om evidens og praktisk anvendelse
- hjælpe brugeren med let, ikke-klinisk refleksion om vaner, adfærd, mønstre, triggere og metakognitive tendenser

Du må ikke:
- diagnosticere
- love effekt
- opføre dig som om chatten er behandling
- presse brugeren ind i dyb terapi eller intens følelsesudforskning
- låse brugerens problem til én bestemt forklaring

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
   Bruges når brugeren tydeligt vil forstå egne vaner, adfærd, reaktioner, relationelle mønstre eller metakognitive problemstillinger.
   Det er stadig ikke terapi. Hjælp med rolig, let struktur:
   - anerkend temaet kort
   - giv 1-3 konkrete observationsvinkler
   - spørg højst én ting, som hjælper brugeren med at lægge mærke til et mønster
   Brug observation frem for tolkning.
   Relevante vinkler kan være:
   - situation eller trigger
   - tanker eller forventninger lige før reaktionen
   - kropslige signaler
   - følelser
   - automatisk adfærd eller tilbagetrækning
   - hvad der sker bagefter
   - ved metakognitive temaer: hvordan brugeren forholder sig til egne tanker, grublen, overvågning af sig selv eller indre pres

5) closing
   Bruges ved korte sociale lukninger som "tak".
   Svar meget kort. Gentag ikke en fuld afslutning.

PROBLEMFORSTÅELSE
Refleksion skal være generisk og kunne bruges på mange temaer, fx:
- vaner
- relationelle mønstre
- energitab
- undgåelse
- uro
- selvkritik
- overtænkning
- kontrolbehov
- stressreaktioner
- alkohol eller andre konkrete vaner
Behandl disse som variationer af mønsterforståelse, ikke som særskilte specialspor.

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
        .slice(0, 4)
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

function countUserMatches(
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
    "reflektere over det",
    "selvindsigt",
    "forstå mine mønstre",
    "forstå mit mønster",
    "forstå hvorfor",
    "forstå hvad der sker i mig",
    "forstå mig selv bedre",
    "blive mere bevidst",
    "være mere bevidst",
    "lægge mærke til",
    "undersøge mine vaner",
    "undersøge min adfærd",
    "se på mit mønster",
    "se på min reaktion",
    "meta kognitiv",
    "metakognitiv",
    "jeg vil gerne reflektere",
    "kan vi reflektere",
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

function isPatternStatement(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "jeg plejer",
    "jeg ender ofte",
    "jeg ender tit",
    "jeg gør altid",
    "jeg gør tit",
    "jeg bliver altid",
    "jeg bliver tit",
    "jeg mister energien",
    "jeg bliver træt",
    "jeg bliver stille",
    "jeg trækker mig",
    "jeg lukker ned",
    "jeg undgår",
    "jeg protesterer",
    "det sker når",
    "typisk",
    "ofte",
    "især",
    "særligt",
    "saerligt",
    "hver gang",
    "når det handler om",
    "når jeg",
    "naar jeg",
    "når vi",
    "naar vi",
  ].some((phrase) => t.includes(phrase))
}

function isBehaviorTheme(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "vane",
    "vaner",
    "adfærd",
    "adfaerd",
    "mønster",
    "moenster",
    "reaktion",
    "reaktioner",
    "trigger",
    "triggere",
    "energi",
    "energitab",
    "konflikt",
    "relation",
    "kone",
    "mand",
    "partner",
    "arbejde",
    "stress",
    "søvn",
    "soevn",
    "uro",
    "angst",
    "selvkritik",
    "overtænker",
    "overtaenker",
    "grubler",
    "gruble",
    "kontrol",
    "protest",
    "alkohol",
    "vin",
    "øl",
    "oel",
  ].some((phrase) => t.includes(phrase))
}

function isMetaCognitiveTheme(text: string): boolean {
  const t = stripPunctuation(text)

  return [
    "jeg tænker meget over hvad jeg tænker",
    "jeg taenker meget over hvad jeg taenker",
    "jeg overvåger mig selv",
    "jeg analyserer mig selv hele tiden",
    "jeg grubler",
    "jeg overtænker",
    "jeg overtaenker",
    "jeg går i ring",
    "jeg gaar i ring",
    "jeg kan ikke slippe tanken",
    "jeg holder øje med mig selv",
    "jeg vurderer mine egne tanker",
    "metakognitiv",
    "meta kognitiv",
  ].some((phrase) => t.includes(phrase))
}

function isReflectionFollowUp(text: string): boolean {
  const t = stripPunctuation(text)

  if (!t) return false

  return [
    "når",
    "naar",
    "typisk",
    "ofte",
    "især",
    "saerligt",
    "lige før",
    "lige foer",
    "bagefter",
    "det sker når",
    "det sker naar",
    "i kroppen",
    "i mine tanker",
    "i tankerne",
    "jeg mærker",
    "jeg maerker",
    "jeg bliver",
    "jeg får",
    "jeg faar",
    "jeg ender",
    "jeg trækker mig",
    "jeg traekker mig",
    "jeg lukker ned",
    "jeg protesterer",
    "relation",
    "kone",
    "partner",
    "arbejde",
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
  if (isEvidenceQuestion(userText)) return "information_question_only"

  const patternHitsBefore = countUserMatches(transcript, isPatternStatement)
  const patternSignalsNow =
    isPatternStatement(userText) ||
    isBehaviorTheme(userText) ||
    isMetaCognitiveTheme(userText)

  if (patternSignalsNow && patternHitsBefore >= 1) return "pattern_signal_detected"

  if (reflectionContext.isActive && (patternSignalsNow || isReflectionFollowUp(userText))) {
    return "active_reflection_follow_up"
  }

  if (!patternSignalsNow) return "topic_not_established"

  return "general"
}

function decideMode(params: {
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
    readiness === "pattern_signal_detected" ||
    readiness === "active_reflection_follow_up"
  ) {
    return { mode: "guided_reflection", readiness }
  }

  return { mode: "informational", readiness }
}

function extractTopic(text: string, fallback?: string): string | undefined {
  const t = stripPunctuation(text)

  if (["kone", "mand", "partner", "forhold", "relation", "relationer"].some((x) => t.includes(x))) {
    return "relationer"
  }

  if (["træt", "traet", "energi", "energitab", "udmattet", "stille"].some((x) => t.includes(x))) {
    return "energi og reaktioner"
  }

  if (["alkohol", "vin", "øl", "oel", "drikker", "drikke"].some((x) => t.includes(x))) {
    return "alkohol og vaner"
  }

  if (["vane", "vaner", "rutine", "automatisk"].some((x) => t.includes(x))) {
    return "vaner og mønstre"
  }

  if (["søvn", "soevn", "sove"].some((x) => t.includes(x))) {
    return "søvn"
  }

  if (["stress", "pres", "uro"].some((x) => t.includes(x))) {
    return "stress og uro"
  }

  if (["angst", "bekymring", "grubler", "overtænker", "overtaenker"].some((x) => t.includes(x))) {
    return "bekymringer og tankeprocesser"
  }

  if (["meta", "metakognitiv", "meta kognitiv"].some((x) => t.includes(x))) {
    return "metakognitive mønstre"
  }

  return fallback && fallback.trim() ? fallback.trim() : undefined
}

function inferTopicTags(text: string, topic?: string): string[] {
  const t = stripPunctuation(text)
  const tags = new Set<string>()

  if (topic) tags.add(topic)

  if (["vane", "vaner", "rutine", "automatisk", "gentager"].some((x) => t.includes(x))) {
    tags.add("vaner")
  }

  if (["adfærd", "adfaerd", "reaktion", "reaktioner", "protest"].some((x) => t.includes(x))) {
    tags.add("reaktioner")
  }

  if (["relation", "relationer", "kone", "mand", "partner", "forhold"].some((x) => t.includes(x))) {
    tags.add("relationer")
  }

  if (["træt", "traet", "energi", "energitab", "udmattet"].some((x) => t.includes(x))) {
    tags.add("energi")
  }

  if (["grubler", "overtænker", "overtaenker", "metakognitiv", "meta kognitiv"].some((x) => t.includes(x))) {
    tags.add("metakognition")
  }

  if (["alkohol", "vin", "øl", "oel", "drikker"].some((x) => t.includes(x))) {
    tags.add("alkohol")
  }

  if (tags.size === 0 && topic) {
    tags.add(topic)
  }

  return Array.from(tags).slice(0, 4)
}

function inferProblemTitle(topic: string | undefined, text: string): string | undefined {
  if (!topic) return undefined

  if (topic === "relationer") return "mønster i relationer"
  if (topic === "energi og reaktioner") return "energitab og tilbagetrækning"
  if (topic === "alkohol og vaner") return "vane omkring alkohol"
  if (topic === "metakognitive mønstre") return "metakognitive mønstre"

  const normalized = normalizeText(text)
  if (normalized.length <= 80) return normalized
  return topic
}

function inferProblemSummary(topic: string | undefined): string | undefined {
  if (!topic) return undefined

  const map: Record<string, string> = {
    "relationer": "Ønske om at forstå mønstre, energitab eller reaktioner i relationer.",
    "energi og reaktioner": "Ønske om at forstå situationer hvor energi falder, og hvordan reaktionen udvikler sig.",
    "alkohol og vaner": "Ønske om at forstå eller ændre en vane forbundet med alkohol.",
    "vaner og mønstre": "Ønske om at forstå en tilbagevendende vane eller et mønster i adfærd.",
    "stress og uro": "Ønske om at forstå triggere, reaktioner og mønstre ved stress eller uro.",
    "bekymringer og tankeprocesser": "Ønske om at forstå bekymringer, overtænkning eller tilbagevendende tankeprocesser.",
    "metakognitive mønstre": "Ønske om at blive mere bevidst om hvordan egne tanker, grublen eller selvobservation udvikler sig.",
  }

  return map[topic] ?? `Ønske om at forstå mønstre relateret til ${topic}.`
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
  topic?: string
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
      "Hypnoterapi bruges ofte som støtte til vaneændring, ro og mønsterarbejde, men evidensen varierer efter problemtype og er ofte blandet. " +
      "Det giver typisk mest mening som del af en bredere indsats frem for som én universel løsning."
    )
  }

  if (params.mode === "guided_reflection") {
    const topicLead = params.topic
      ? `Når et tema som ${params.topic} begynder at gentage sig, `
      : "Når en reaktion eller vane begynder at gentage sig, "

    return (
      topicLead +
      "kan det hjælpe at lægge mærke til situationen lige før, hvad der sker i kroppen eller tankerne, og hvad der typisk følger bagefter. " +
      "Hvad lægger du først mærke til, lige inden mønsteret går i gang?"
    )
  }

  return (
    "Hypnoterapi bruges ofte til at arbejde med vaner, automatiske reaktioner og opmærksomhed. " +
    "Jeg kan enten forklare, hvordan et typisk forløb foregår, eller hjælpe med at undersøge et mønster, du gerne vil forstå bedre."
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
  userText: string
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
      ? "active_reflection_follow_up"
      : params.readiness

  const derivedTopicTags = inferTopicTags(params.userText, params.topic)
  const derivedProblemTitle = inferProblemTitle(params.topic, params.userText)
  const derivedProblemSummary = inferProblemSummary(params.topic)

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

  if (params.parsed?.problem_title || derivedProblemTitle) {
    meta["gen_hypno.problem_title"] = params.parsed?.problem_title || derivedProblemTitle
  }

  if (params.parsed?.problem_summary || derivedProblemSummary) {
    meta["gen_hypno.problem_summary"] = params.parsed?.problem_summary || derivedProblemSummary
  }

  if (params.parsed?.topic_tags?.length || derivedTopicTags.length) {
    meta["gen_hypno.topic_tags"] = params.parsed?.topic_tags?.length
      ? params.parsed.topic_tags
      : derivedTopicTags
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
        userText,
      }),
    }

    return {
      transition,
      debug: {
        capability: "unified-hypno-v3",
        used_fallback: false,
      },
    }
  }

  const { mode, readiness } = decideMode({
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

  const topic = parsed?.last_topic || extractTopic(userText, previousTopic)

  if (!assistant && mode !== "closing") {
    assistant = buildFallbackMessage({ mode, transcript, topic })
    usedFallback = true
  }

  const updatedTranscript = appendTranscript(transcript, userText, assistant)

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
      userText,
    }),
  }

  return {
    transition,
    debug: {
      capability: "unified-hypno-v3",
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
