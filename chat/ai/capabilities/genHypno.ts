import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { normalizeFinalResponse } from "../contracts/responseContract"
import { PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { analyzeTurn } from "../orchestration/analyzeTurn"
import { applyPolicy, detectClosingText, detectContinuationIntent, detectDirectContactRequest, detectPracticalKeywords } from "../orchestration/applyPolicy"
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

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function stripPunctuation(text: string): string {
  return normalize(text).replace(/[.,!?;:()\"'\u2019\u201c\u201d\u2018\\/-]/g, " ")
}

// --- Transcript helpers ---

function readTranscriptByKey(context: AiCapabilityContext, key: string): TranscriptTurn[] {
  const raw = context.state.meta[key]?.value
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is { role: "user" | "assistant"; content: string } =>
      item && typeof item === "object" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    )
    .map((item) => ({ role: item.role, content: item.content.trim() }))
    .filter((item) => item.content)
}

function readStringMeta(context: AiCapabilityContext, key: string): string | undefined {
  const value = context.state.meta[key]?.value
  if (typeof value !== "string") return undefined
  return value.trim() || undefined
}

function readMoveMeta(context: AiCapabilityContext): string | undefined {
  const value = context.state.meta["dialog.move"]?.value
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function lastAssistantExcerpt(transcript: TranscriptTurn[]): string | undefined {
  return [...transcript].reverse().find((t) => t.role === "assistant")?.content
}

function countAssistantTurns(turns: TranscriptTurn[]): number {
  return turns.filter((t) => t.role === "assistant").length
}

function trimTranscript(turns: TranscriptTurn[]): TranscriptTurn[] {
  const capped = turns.slice(-MAX_TRANSCRIPT_TURNS)
  const result: TranscriptTurn[] = []
  let totalChars = 0

  for (let i = capped.length - 1; i >= 0; i--) {
    const len = capped[i].content.length
    if (totalChars + len > MAX_TRANSCRIPT_CHARS) break
    result.unshift(capped[i])
    totalChars += len
  }

  return result
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  if (userText.trim()) next.push({ role: "user", content: userText.trim() })
  if (assistantText.trim()) next.push({ role: "assistant", content: assistantText.trim() })
  return next
}

// --- Exit detection ---

function isHardExit(text: string): boolean {
  const t = stripPunctuation(text)
  const exact = ["stop", "afslut", "slut", "tilbage", "hjem", "home", "menu", "hovedmenu", "ikke nu"]
  if (exact.includes(t)) return true
  const phrases = ["gå tilbage", "gaa tilbage", "tilbage til menu", "tilbage til hovedmenu", "gå til menu", "gaa til menu", "gå hjem", "gaa hjem"].map(stripPunctuation)
  return phrases.some((p) => ` ${t} `.includes(` ${p} `))
}

// --- Closing messages ---

function buildClosingMessage(transcript: TranscriptTurn[]): string {
  const last = [...transcript].reverse().find((t) => t.role === "assistant")
  if (!last) return "Selv tak."
  if (/^selv tak[.!]?$/i.test(last.content.trim())) return "Det var så lidt."
  return "Selv tak."
}

// --- Fallback responses ---

function buildFallbackMessage(mode: PromptMode, transcript: TranscriptTurn[], topic?: string): string {
  if (mode === "closing") return buildClosingMessage(transcript)
  if (mode === "practical") return "Du kan kontakte Jan på +45 42 80 74 74 eller jan@gaarsdal.net. Hvis du vil, kan du kort beskrive hvad du ønsker hjælp til og spørge om ledige tider."
  if (mode === "evidence") return "Hypnoterapi bruges som støtte til vaneændring, ro og mønsterarbejde, men evidensen varierer efter problemtype og er ofte blandet. Det giver typisk mest mening som del af en bredere indsats."
  if (mode === "reflection") {
    const lead = topic
      ? `Det ligner, at ${topic} hurtigt bliver et sted, hvor du prøver at få kontrol eller afstand. `
      : "Det ligner, at oplevelse, kropslig reaktion og forsøg på at få kontrol hurtigt smelter sammen. "
    return lead + "Det mest interessante er ikke kun følelsen, men hvad du gør i samme øjeblik for at slippe væk fra den."
  }
  return "Jeg kan godt hjælpe med at forstå det nærmere. Det giver mest mening at tage udgangspunkt i hvad der sker i dig eller din hverdag, frem for generel metodeforklaring."
}

// --- Topic / tag extraction (unchanged from original - good logic) ---

function extractTopic(text: string, fallback?: string): string | undefined {
  const t = stripPunctuation(text)
  const topicMap: [string[], string][] = [
    [["kone", "mand", "partner", "forhold", "relation", "relationer"], "relationer"],
    [["træt", "traet", "energi", "energitab", "udmattet"], "energi og reaktioner"],
    [["alkohol", "vin", "øl", "oel", "drikker", "drikke"], "alkohol og vaner"],
    [["vane", "vaner", "rutine", "automatisk"], "vaner og mønstre"],
    [["søvn", "soevn", "sove"], "søvn"],
    [["stress", "pres", "uro"], "stress og uro"],
    [["angst", "bekymring", "grubler", "overtænker", "overtaenker"], "bekymringer og tankeprocesser"],
    [["meta", "metakognitiv", "meta kognitiv"], "metakognitive mønstre"],
  ]
  for (const [keywords, topic] of topicMap) {
    if (keywords.some((k) => t.includes(k))) return topic
  }
  return fallback?.trim() || undefined
}

function inferTopicTags(text: string, topic?: string): string[] {
  const t = stripPunctuation(text)
  const tags = new Set<string>()
  if (topic) tags.add(topic)
  if (["vane", "vaner", "rutine", "automatisk", "gentager"].some((x) => t.includes(x))) tags.add("vaner")
  if (["adfærd", "adfaerd", "reaktion", "reaktioner"].some((x) => t.includes(x))) tags.add("reaktioner")
  if (["relation", "relationer", "kone", "mand", "partner", "forhold"].some((x) => t.includes(x))) tags.add("relationer")
  if (["træt", "traet", "energi", "energitab", "udmattet"].some((x) => t.includes(x))) tags.add("energi")
  if (["grubler", "overtænker", "overtaenker", "metakognitiv"].some((x) => t.includes(x))) tags.add("metakognition")
  if (["alkohol", "vin", "øl", "oel", "drikker"].some((x) => t.includes(x))) tags.add("alkohol")
  return Array.from(tags).slice(0, 4)
}

function inferProblemTitle(topic: string | undefined, text: string): string | undefined {
  if (!topic) return undefined
  const titleMap: Record<string, string> = {
    "relationer": "mønster i relationer",
    "energi og reaktioner": "energitab og tilbagetrækning",
    "alkohol og vaner": "vane omkring alkohol",
    "metakognitive mønstre": "metakognitive mønstre",
  }
  return titleMap[topic] ?? (text.length <= 80 ? normalize(text) : topic)
}

function inferProblemSummary(topic: string | undefined): string | undefined {
  if (!topic) return undefined
  const summaryMap: Record<string, string> = {
    "relationer": "Ønske om at forstå mønstre, energitab eller reaktioner i relationer.",
    "energi og reaktioner": "Ønske om at forstå situationer hvor energi falder, og hvordan reaktionen udvikler sig.",
    "alkohol og vaner": "Ønske om at forstå eller ændre en vane forbundet med alkohol.",
    "vaner og mønstre": "Ønske om at forstå en tilbagevendende vane eller et mønster i adfærd.",
    "stress og uro": "Ønske om at forstå triggere, reaktioner og mønstre ved stress eller uro.",
    "bekymringer og tankeprocesser": "Ønske om at forstå bekymringer, overtænkning eller tilbagevendende tankeprocesser.",
    "metakognitive mønstre": "Ønske om at blive mere bevidst om hvordan egne tanker, grublen eller selvobservation udvikler sig.",
  }
  return summaryMap[topic] ?? `Ønske om at forstå mønstre relateret til ${topic}.`
}

// --- Analysis fallback ---

function buildDefaultAnalysis(userText: string, previousTopic?: string, forcedMode?: Exclude<PromptMode, "closing">): TurnAnalysis {
  if (detectClosingText(userText)) {
    return {
      intent: "social_closing", proposed_mode: "closing", conversation_move: "close",
      investigation_focus: "none", response_goal: "close_briefly", relational_state: "gentle_close",
      topic: previousTopic, sensitivity: "low", signals: ["soft_closing"], confidence: 0.98,
    }
  }

  if (forcedMode) {
    return {
      intent: forcedMode === "reflection" ? "explore_pattern" : forcedMode === "evidence" ? "ask_evidence" : "understand_method",
      proposed_mode: forcedMode,
      conversation_move: forcedMode === "reflection" ? "guided_observation" : forcedMode === "practical" ? "practical_preparation" : "direct_answer",
      investigation_focus: forcedMode === "reflection" ? "attention" : forcedMode === "practical" ? "preparation" : "none",
      response_goal: forcedMode === "reflection" ? "answer_then_one_question" : "answer_directly",
      relational_state: forcedMode === "reflection" ? "building_trust" : forcedMode === "practical" ? "decision_support" : "building_clarity",
      topic: previousTopic, sensitivity: "medium", signals: ["forced_mode"], confidence: 0.95,
    }
  }

  if (detectPracticalKeywords(userText)) {
    return {
      intent: "seek_practical_help", proposed_mode: "practical", conversation_move: "practical_preparation",
      investigation_focus: "preparation", response_goal: "answer_directly", relational_state: "decision_support",
      topic: previousTopic, sensitivity: "low", signals: ["practical_keyword"], confidence: 0.82,
    }
  }

  if (["evidens", "virker", "forskning", "studier", "dokumentation"].some((x) => normalize(userText).includes(x))) {
    return {
      intent: "ask_evidence", proposed_mode: "evidence", conversation_move: "direct_answer",
      investigation_focus: "none", response_goal: "answer_directly", relational_state: "decision_support",
      topic: previousTopic, sensitivity: "low", signals: ["evidence_keyword"], confidence: 0.8,
    }
  }

  if (["har svært ved", "kan ikke", "kommer ikke i gang", "holde ved", "utryg", "urolig", "træt", "tung", "modstand", "barriere"].some((x) => normalize(userText).includes(x))) {
    return {
      intent: "explore_pattern", proposed_mode: "reflection", conversation_move: "guided_observation",
      investigation_focus: normalize(userText).includes("trang") || normalize(userText).includes("uro") ? "regulation" : "pattern",
      response_goal: "answer_then_one_question", relational_state: "building_trust",
      topic: previousTopic, sensitivity: "medium", signals: ["personal_difficulty"], confidence: 0.72,
    }
  }

  return {
    intent: "understand_method", proposed_mode: "info", conversation_move: "direct_answer",
    investigation_focus: "none", response_goal: "answer_directly", relational_state: "orienting",
    topic: previousTopic, sensitivity: "low", signals: ["default_info"], confidence: 0.55,
  }
}

// --- Analysis rebalancing (unchanged logic) ---

function rebalanceAnalysis(params: {
  analysis: TurnAnalysis
  previousMove?: string
  transcript: TranscriptTurn[]
  userText: string
}): TurnAnalysis {
  const { analysis, previousMove, transcript, userText } = params
  if (analysis.proposed_mode !== "reflection") return analysis

  const assistantCount = countAssistantTurns(transcript)
  const explicitAvoidance = ["undskyld", "undskyldninger", "leder efter", "venter på", "udsætter", "finder en grund", "lader være", "slippe for"].some(
    (x) => normalize(userText).includes(x)
  )

  if (previousMove && previousMove === analysis.conversation_move) {
    if (explicitAvoidance) {
      return { ...analysis, conversation_move: "mild_challenge", investigation_focus: analysis.investigation_focus === "none" ? "interpretation" : analysis.investigation_focus, response_goal: "answer_directly" }
    }
    if (assistantCount >= 2) {
      return { ...analysis, conversation_move: "synthesis", investigation_focus: "pattern", response_goal: "answer_directly" }
    }
  }

  if (assistantCount >= 3 && explicitAvoidance && analysis.conversation_move !== "synthesis") {
    return { ...analysis, conversation_move: "synthesis", investigation_focus: "pattern", response_goal: "answer_directly" }
  }

  return analysis
}

// --- Meta delta builder ---

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
  const prevAssistantCount = countAssistantTurns(previousTranscript)
  const nextAssistantCount = params.assistantMessage ? prevAssistantCount + 1 : prevAssistantCount

  const dialogStage = params.mode === "closing" ? "close" : params.mode === "reflection" ? "explore_patterns" : "open"
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
  if (params.objective) meta["dialog.objective"] = params.objective
  if (params.mode === "reflection") {
    meta["focused_reflection.entry_source"] = params.sourceNode
    meta["focused_reflection.user_opt_in"] = true
    meta["focused_reflection.stage"] = "OPEN"
    meta["focused_reflection.transcript"] = params.updatedTranscript
  }
  if (params.mode === "closing") meta["focused_reflection.stage"] = "CLOSED"
  if (derivedProblemTitle) meta["gen_hypno.problem_title"] = derivedProblemTitle
  if (derivedProblemSummary) meta["gen_hypno.problem_summary"] = derivedProblemSummary
  if (derivedTopicTags.length) meta["gen_hypno.topic_tags"] = derivedTopicTags

  return meta
}

// --- Main capability runner ---

export async function runUnifiedHypnoCapability(
  context: AiCapabilityContext,
  llm: LlmClient,
  options: UnifiedRunOptions
): Promise<AiCapabilityResult> {
  const transcript = readTranscriptByKey(context, options.transcriptKey)
  const trimmedTranscript = trimTranscript(transcript)
  const userText = context.userText ?? ""
  const previousTopic = readStringMeta(context, "gen_hypno.last_topic") || readStringMeta(context, "dialog.topic")

  // Hard exit
  if (isHardExit(userText)) {
    const assistant = "Helt fint. Vi stopper her, og du kan vende tilbage senere."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "HOME",
        reason: "user-requested-exit",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
          sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
          mode: "closing", relationalState: "gentle_close",
        }),
      },
      debug: { capability: "unified-hypno-v4", used_fallback: false },
    }
  }

  // ─── Intent routing: booking ────────────────────────────────────────────────
  // Detect explicit booking/contact intent and route directly to HANDOFF_FORM.
  // This fires from within GEN_HYPNO so users don't have to navigate to HOME first.
  const bookingKeywords = [
    "book", "booke", "booking", "bestil", "bestille",
    "kontakt jan", "kontakt mig", "ring til mig",
    "vil gerne booke", "vil gerne bestille", "vil gerne have en tid",
    "lave en aftale", "aftale en tid", "have tid", "ledige tider",
    "møde med jan", "tale med jan", "ringe til jan",
  ]
  const fitCheckKeywords = [
    "er jeg den rigtige", "passer det til mig", "er det for mig",
    "virker det for mig", "kan det hjælpe mig", "usikker på om",
    "ved ikke om hypnoterapi", "er jeg kandidat", "egnet til",
    "rigtig til hypno", "rigtige til hypno",
  ]

  const normalizedUser = userText.toLowerCase().trim()
  const isBookingIntent = bookingKeywords.some((k) => normalizedUser.includes(k))
  const isFitCheckIntent = fitCheckKeywords.some((k) => normalizedUser.includes(k))

  if (isBookingIntent && options.stayOnNode === "GEN_HYPNO") {
    const assistant = "Godt. Udfyld nedenstående — Jan kontakter dig inden for 24 timer."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "HANDOFF_FORM",
        reason: "gen-hypno:booking-intent",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
          sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "practical"),
          mode: "practical", relationalState: "decision_support",
        }),
      },
      debug: { capability: "unified-hypno-v4", used_fallback: false },
    }
  }

  // Lead capture: not ready yet but wants to stay in touch
  const leadKeywords = [
    "ikke klar", "ikke klar nu", "tænke over det", "overveje det",
    "mere information", "mere info", "send mig", "vende tilbage",
    "ikke nu", "måske senere", "på et andet tidspunkt",
    "holder mig opdateret", "skriv til mig", "email mig",
  ]
  const isLeadIntent = leadKeywords.some((k) => normalizedUser.includes(k))

  if (isLeadIntent && options.stayOnNode === "GEN_HYPNO") {
    const assistant = "Ingen stress — du behøver ikke beslutte dig nu. Efterlad din email, så sender Jan en kort besked om hvad en første session typisk indebærer."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "LEAD_CAPTURE",
        reason: "gen-hypno:lead-intent",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
          sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "practical"),
          mode: "practical", relationalState: "decision_support",
        }),
      },
      debug: { capability: "unified-hypno-v4", used_fallback: false },
    }
  }

  if (isFitCheckIntent && options.stayOnNode === "GEN_HYPNO") {
    const assistant = "Lad os tage et øjeblik og afklare om hypnoterapi giver mening for dig."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "PREQUALIFY",
        reason: "gen-hypno:fit-check-intent",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
          sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
          mode: "info", relationalState: "decision_support",
        }),
      },
      debug: { capability: "unified-hypno-v4", used_fallback: false },
    }
  }

  // Analyze turn
  let analysis: TurnAnalysis | null = null
  let usedFallback = false
  const previousMove = readMoveMeta(context)

  try {
    analysis = await analyzeTurn({
      llm, transcript: trimmedTranscript, userText,
      lastTopic: previousTopic, lastMove: previousMove,
      lastAssistantExcerpt: lastAssistantExcerpt(trimmedTranscript),
    })
  } catch {
    usedFallback = true
  }

  analysis = analysis ?? buildDefaultAnalysis(userText, previousTopic, options.forcedMode)
  analysis = rebalanceAnalysis({ analysis, previousMove, transcript: trimmedTranscript, userText })

  // Apply forced mode if set
  if (options.forcedMode && analysis.proposed_mode !== "closing") {
    analysis = {
      ...analysis,
      proposed_mode: options.forcedMode,
      intent: options.forcedMode === "reflection" ? "explore_pattern" : analysis.intent,
      conversation_move: options.forcedMode === "reflection" ? "guided_observation" : options.forcedMode === "practical" ? "practical_preparation" : analysis.conversation_move,
      investigation_focus: options.forcedMode === "reflection" ? "attention" : options.forcedMode === "practical" ? "preparation" : analysis.investigation_focus,
      response_goal: options.forcedMode === "reflection" ? "answer_then_one_question" : analysis.response_goal,
      relational_state: options.forcedMode === "reflection" ? "building_trust" : options.forcedMode === "practical" ? "decision_support" : "building_clarity",
    }
  }

  const policy = applyPolicy({ userText, analysis, transcript: trimmedTranscript })

  let assistant = ""
  let responseTopic = analysis.topic
  let responseObjective = analysis.objective
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
          analysis, policy, transcript: trimmedTranscript, userText,
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
    assistant = buildFallbackMessage(modeUsed, transcript, topic)
    usedFallback = true
  }

  // ─── Proaktiv CTA ─────────────────────────────────────────────────────────
  // After turn 5 with a clear topic and in a non-closing mode, gently offer
  // to tell the user what a concrete session would involve. Only fires once.
  const previousAssistantCount = countAssistantTurns(transcript)
  const ctaAlreadyShown = context.state.meta["gen_hypno.cta_shown"]?.value === true
  const ctaConditionsMet =
    !ctaAlreadyShown &&
    previousAssistantCount >= 4 &&
    !!topic &&
    modeUsed !== "closing" &&
    modeUsed !== "practical" &&
    !detectClosingText(userText) || detectContinuationIntent(userText)

  if (ctaConditionsMet) {
    assistant = assistant + "\n\nHvis du ønsker at tale med Jan om, hvad et konkret forløb ville indebære, er du velkommen til at skrive."
  }

  const updatedTranscript = appendTranscript(transcript, userText, assistant)
  const ctaMeta = ctaConditionsMet ? { "gen_hypno.cta_shown": true } : {}

  return {
    transition: {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: options.stayOnNode,
      reason: `unified-hypno:${modeUsed}`,
      response_message: assistant,
      meta_delta: {
        ...buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript, topic,
          sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
          analysis, mode: modeUsed, objective: responseObjective,
          relationalState: analysis.relational_state,
        }),
        ...ctaMeta,
      },
    },
    debug: { capability: "unified-hypno-v4", used_fallback: usedFallback },
  }
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    return runUnifiedHypnoCapability(context, llm, {
      transcriptKey: "gen_hypno.transcript",
      sourceNode: "GEN_HYPNO",
      stayOnNode: "GEN_HYPNO",
    })
  },
}

export default genHypnoCapability
