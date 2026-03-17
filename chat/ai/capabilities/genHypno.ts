import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmClient,
} from "../types"
import { normalizeFinalResponse } from "../contracts/responseContract"
import { PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { analyzeTurn } from "../orchestration/analyzeTurn"
import { applyPolicy } from "../orchestration/applyPolicy"
import { assembleResponseMessages } from "../orchestration/assemblePrompt"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type UnifiedRunOptions = {
  transcriptKey: string
  sourceNode: string
  stayOnNode: string
  forcedMode?: Exclude<PromptMode, "closing">
}

const MAX_TRANSCRIPT_TURNS = 30
const MAX_TRANSCRIPT_CHARS = 6000

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

function readStringMeta(
  context: AiCapabilityContext,
  key: string
): string | undefined {
  const value = context.state.meta[key]?.value
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed || undefined
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

function countAssistantTurns(turns: TranscriptTurn[]): number {
  return turns.filter((turn) => turn.role === "assistant").length
}

function isSoftClosing(text: string): boolean {
  const t = normalizeText(text)
  return ["tak", "mange tak", "super", "fint", "okay tak", "ok tak", "selv tak"].includes(t)
}

function hasCommandPhrase(text: string, phrase: string): boolean {
  const padded = ` ${text} `
  const target = ` ${phrase} `
  return padded.includes(target)
}

function isHardExit(text: string): boolean {
  const t = stripPunctuation(text)

  const exactCommands = [
    "stop",
    "afslut",
    "slut",
    "tilbage",
    "hjem",
    "home",
    "menu",
    "hovedmenu",
    "ikke nu",
  ]

  if (exactCommands.includes(t)) return true

  const commandPhrases = [
    "gå tilbage",
    "gaa tilbage",
    "tilbage til menu",
    "tilbage til hovedmenu",
    "gå til menu",
    "gaa til menu",
    "gå hjem",
    "gaa hjem",
  ].map(stripPunctuation)

  return commandPhrases.some((phrase) => hasCommandPhrase(t, phrase))
}

function buildClosingMessage(transcript: TranscriptTurn[]): string {
  const lastAssistant = [...transcript]
    .reverse()
    .find((turn) => turn.role === "assistant")

  if (!lastAssistant) return "Selv tak."
  if (/^selv tak[.!]?$/i.test(lastAssistant.content.trim())) return "Det var så lidt."
  return "Selv tak."
}

function extractTopic(text: string, fallback?: string): string | undefined {
  const t = stripPunctuation(text)

  if (
    ["kone", "mand", "partner", "forhold", "relation", "relationer"].some((x) =>
      t.includes(x)
    )
  ) {
    return "relationer"
  }
  if (
    ["træt", "traet", "energi", "energitab", "udmattet", "stille"].some((x) =>
      t.includes(x)
    )
  ) {
    return "energi og reaktioner"
  }
  if (
    ["alkohol", "vin", "øl", "oel", "drikker", "drikke"].some((x) =>
      t.includes(x)
    )
  ) {
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
  if (
    ["angst", "bekymring", "grubler", "overtænker", "overtaenker"].some((x) =>
      t.includes(x)
    )
  ) {
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

  if (
    ["vane", "vaner", "rutine", "automatisk", "gentager"].some((x) =>
      t.includes(x)
    )
  ) {
    tags.add("vaner")
  }
  if (
    ["adfærd", "adfaerd", "reaktion", "reaktioner", "protest"].some((x) =>
      t.includes(x)
    )
  ) {
    tags.add("reaktioner")
  }
  if (
    ["relation", "relationer", "kone", "mand", "partner", "forhold"].some((x) =>
      t.includes(x)
    )
  ) {
    tags.add("relationer")
  }
  if (
    ["træt", "traet", "energi", "energitab", "udmattet"].some((x) =>
      t.includes(x)
    )
  ) {
    tags.add("energi")
  }
  if (
    ["grubler", "overtænker", "overtaenker", "metakognitiv", "meta kognitiv"].some(
      (x) => t.includes(x)
    )
  ) {
    tags.add("metakognition")
  }
  if (["alkohol", "vin", "øl", "oel", "drikker"].some((x) => t.includes(x))) {
    tags.add("alkohol")
  }

  if (tags.size === 0 && topic) tags.add(topic)
  return Array.from(tags).slice(0, 4)
}

function inferProblemTitle(
  topic: string | undefined,
  text: string
): string | undefined {
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
    relationer:
      "Ønske om at forstå mønstre, energitab eller reaktioner i relationer.",
    "energi og reaktioner":
      "Ønske om at forstå situationer hvor energi falder, og hvordan reaktionen udvikler sig.",
    "alkohol og vaner":
      "Ønske om at forstå eller ændre en vane forbundet med alkohol.",
    "vaner og mønstre":
      "Ønske om at forstå en tilbagevendende vane eller et mønster i adfærd.",
    "stress og uro":
      "Ønske om at forstå triggere, reaktioner og mønstre ved stress eller uro.",
    "bekymringer og tankeprocesser":
      "Ønske om at forstå bekymringer, overtænkning eller tilbagevendende tankeprocesser.",
    "metakognitive mønstre":
      "Ønske om at blive mere bevidst om hvordan egne tanker, grublen eller selvobservation udvikler sig.",
  }

  return map[topic] ?? `Ønske om at forstå mønstre relateret til ${topic}.`
}

function buildFallbackMessage(params: {
  mode: PromptMode
  transcript: TranscriptTurn[]
  topic?: string
}): string {
  if (params.mode === "closing") return buildClosingMessage(params.transcript)

  if (params.mode === "practical") {
    return "Du kan kontakte Jan på +45 42 80 74 74 eller jan@gaarsdal.net. Klinikken ligger på Bakkevej 36, 3460 Birkerød."
  }

  if (params.mode === "evidence") {
    return "Hypnoterapi bruges ofte som støtte til vaneændring, ro og mønsterarbejde, men evidensen varierer efter problemtype og er ofte blandet. Det giver typisk mest mening som del af en bredere indsats frem for som én universel løsning."
  }

  if (params.mode === "reflection") {
    const topicLead = params.topic
      ? `Når et tema som ${params.topic} bliver aktivt, `
      : "Når et mønster bliver aktivt, "

    return (
      topicLead +
      "giver det ofte mere mening at se på, hvad du straks begynder at holde øje med, hvad du tror det betyder, og hvad du automatisk prøver at styre. Det er ofte dér mønsteret bliver tydeligere."
    )
  }

  return "Hypnoterapi bruges ofte til at arbejde med vaner, automatiske reaktioner og opmærksomhed. Jeg kan enten forklare, hvordan et typisk forløb foregår, eller hjælpe med at undersøge et mønster, du gerne vil forstå bedre."
}

function buildDefaultAnalysis(
  userText: string,
  previousTopic?: string,
  forcedMode?: Exclude<PromptMode, "closing">
): TurnAnalysis {
  const normalized = normalizeText(userText)

  if (isSoftClosing(userText)) {
    return {
      intent: "social_closing",
      proposed_mode: "closing",
      conversation_move: "close",
      investigation_focus: "none",
      response_goal: "close_briefly",
      relational_state: "gentle_close",
      topic: previousTopic,
      sensitivity: "low",
      signals: ["soft_closing"],
      confidence: 0.98,
    }
  }

  if (forcedMode) {
    return {
      intent:
        forcedMode === "reflection"
          ? "explore_pattern"
          : forcedMode === "evidence"
            ? "ask_evidence"
            : "understand_method",
      proposed_mode: forcedMode,
      conversation_move:
        forcedMode === "reflection"
          ? "guided_observation"
          : forcedMode === "practical"
            ? "practical_preparation"
            : "direct_answer",
      investigation_focus:
        forcedMode === "reflection"
          ? "attention"
          : forcedMode === "practical"
            ? "preparation"
            : "none",
      response_goal:
        forcedMode === "reflection"
          ? "answer_then_one_question"
          : "answer_directly",
      relational_state:
        forcedMode === "reflection" ? "building_trust" : forcedMode === "practical" ? "decision_support" : "building_clarity",
      topic: previousTopic,
      sensitivity: "medium",
      signals: ["forced_mode"],
      confidence: 0.95,
    }
  }

  if (
    ["kontakt", "booking", "booke", "telefon", "mail", "pris", "adresse"].some(
      (x) => normalized.includes(x)
    )
  ) {
    return {
      intent: "seek_practical_help",
      proposed_mode: "practical",
      conversation_move: "practical_preparation",
      investigation_focus: "preparation",
      response_goal: "answer_directly",
      relational_state: "decision_support",
      topic: previousTopic,
      sensitivity: "low",
      signals: ["practical_keyword"],
      confidence: 0.82,
    }
  }

  if (
    ["evidens", "virker", "forskning", "studier", "dokumentation"].some((x) =>
      normalized.includes(x)
    )
  ) {
    return {
      intent: "ask_evidence",
      proposed_mode: "evidence",
      conversation_move: "direct_answer",
      investigation_focus: "none",
      response_goal: "answer_directly",
      relational_state: "decision_support",
      topic: previousTopic,
      sensitivity: "low",
      signals: ["evidence_keyword"],
      confidence: 0.8,
    }
  }

  return {
    intent: "understand_method",
    proposed_mode: "info",
    conversation_move: "direct_answer",
    investigation_focus: "none",
    response_goal: "answer_directly",
    relational_state: "orienting",
    topic: previousTopic,
    sensitivity: "low",
    signals: ["default_info"],
    confidence: 0.55,
  }
}

function buildMetaDelta(params: {
  context: AiCapabilityContext
  assistantMessage: string
  updatedTranscript: TranscriptTurn[]
  topic: string | undefined
  sourceNode: string
  transcriptKey: string
  userText: string
  analysis: TurnAnalysis
  mode: PromptMode
  objective?: string
  relationalState: RelationalState
}): Record<string, unknown> {
  const previousTranscript = readTranscriptByKey(params.context, params.transcriptKey)
  const previousAssistantCount = countAssistantTurns(previousTranscript)
  const nextAssistantCount = params.assistantMessage
    ? previousAssistantCount + 1
    : previousAssistantCount

  const dialogStage =
    params.mode === "closing"
      ? "close"
      : params.mode === "reflection"
        ? "explore_patterns"
        : "open"

  const derivedTopicTags = inferTopicTags(params.userText, params.topic)
  const derivedProblemTitle = inferProblemTitle(params.topic, params.userText)
  const derivedProblemSummary = inferProblemSummary(params.topic)

  const meta: Record<string, unknown> = {
    [params.transcriptKey]: params.updatedTranscript,
    "gen_hypno.transcript": params.updatedTranscript,
    "gen_hypno.assistant_turn_count": nextAssistantCount,
    "dialog.mode": params.mode,
    "dialog.move": params.analysis.conversation_move,
    "dialog.investigation_focus": params.analysis.investigation_focus,
    "dialog.stage": dialogStage,
    "dialog.relational_state": params.relationalState,
    "gen_hypno.analysis": params.analysis,
  }

  if (params.topic) {
    meta["gen_hypno.last_topic"] = params.topic
    meta["dialog.topic"] = params.topic
    meta["focused_reflection.topic"] = params.topic
  }

  if (params.objective) {
    meta["dialog.objective"] = params.objective
  }

  if (params.mode === "reflection") {
    meta["focused_reflection.entry_source"] = params.sourceNode
    meta["focused_reflection.user_opt_in"] = true
    meta["focused_reflection.stage"] = "OPEN"
    meta["focused_reflection.transcript"] = params.updatedTranscript
  }

  if (params.mode === "closing") {
    meta["focused_reflection.stage"] = "CLOSED"
  }

  if (derivedProblemTitle) meta["gen_hypno.problem_title"] = derivedProblemTitle
  if (derivedProblemSummary) meta["gen_hypno.problem_summary"] = derivedProblemSummary
  if (derivedTopicTags.length) meta["gen_hypno.topic_tags"] = derivedTopicTags

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
  const previousTopic =
    readStringMeta(context, "gen_hypno.last_topic") ||
    readStringMeta(context, "dialog.topic")

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
        topic: previousTopic,
        sourceNode: options.sourceNode,
        transcriptKey: options.transcriptKey,
        userText,
        analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
        mode: "closing",
        relationalState: "gentle_close",
      }),
    }

    return {
      transition,
      debug: {
        capability: "unified-hypno-v4",
        used_fallback: false,
      },
    }
  }

  let analysis: TurnAnalysis | null = null
  let usedFallback = false

  try {
    analysis = await analyzeTurn({
      llm,
      transcript: trimmedTranscript,
      userText,
      lastTopic: previousTopic,
    })
  } catch {
    usedFallback = true
  }

  analysis = analysis ?? buildDefaultAnalysis(userText, previousTopic, options.forcedMode)

  if (options.forcedMode && analysis.proposed_mode !== "closing") {
    analysis = {
      ...analysis,
      proposed_mode: options.forcedMode,
      intent:
        options.forcedMode === "reflection"
          ? "explore_pattern"
          : analysis.intent,
      conversation_move:
        options.forcedMode === "reflection"
          ? "guided_observation"
          : options.forcedMode === "practical"
            ? "practical_preparation"
            : analysis.conversation_move,
      investigation_focus:
        options.forcedMode === "reflection"
          ? "attention"
          : options.forcedMode === "practical"
            ? "preparation"
            : analysis.investigation_focus,
      response_goal:
        options.forcedMode === "reflection"
          ? "answer_then_one_question"
          : analysis.response_goal,
      relational_state:
        options.forcedMode === "reflection"
          ? "building_trust"
          : options.forcedMode === "practical"
            ? "decision_support"
            : "building_clarity",
    }
  }

  const policy = applyPolicy({ userText, analysis, transcript: trimmedTranscript })

  let assistant = ""
  let responseTopic: string | undefined = analysis.topic
  let responseObjective: string | undefined = analysis.objective
  let modeUsed: PromptMode = policy.allow_mode

  if (policy.allow_mode === "closing") {
    assistant = buildClosingMessage(transcript)
  } else {
    try {
      const raw = await llm.chatJson({
        model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
        temperature: policy.allow_mode === "reflection" ? 0.45 : 0.25,
        response_format: { type: "json_object" },
        messages: assembleResponseMessages({
          analysis,
          policy,
          transcript: trimmedTranscript,
          userText,
          lastTopic: previousTopic,
          contextPackSystem: context.contextPack?.system,
          userProfileSystem: context.contextPack?.user_profile,
        }),
      })

      const parsed = normalizeFinalResponse(raw)
      if (parsed?.assistant_message) {
        assistant = parsed.assistant_message
        responseTopic = parsed.topic ?? responseTopic
        responseObjective = parsed.objective ?? responseObjective
        modeUsed = parsed.mode_used
      }
    } catch {
      usedFallback = true
    }
  }

  const topic = responseTopic || extractTopic(userText, previousTopic)

  if (!assistant) {
    assistant = buildFallbackMessage({
      mode: modeUsed,
      transcript,
      topic,
    })
    usedFallback = true
  }

  const updatedTranscript = appendTranscript(transcript, userText, assistant)

  const transition: Transition = {
    type: "NODE_HOP",
    from: context.state.active_node,
    to: options.stayOnNode,
    reason: `unified-hypno:${modeUsed}`,
    response_message: assistant,
    meta_delta: buildMetaDelta({
      context,
      assistantMessage: assistant,
      updatedTranscript,
      topic,
      sourceNode: options.sourceNode,
      transcriptKey: options.transcriptKey,
      userText,
      analysis,
      mode: modeUsed,
      objective: responseObjective,
      relationalState: analysis.relational_state,
    }),
  }

  return {
    transition,
    debug: {
      capability: "unified-hypno-v4",
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
