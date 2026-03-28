import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { normalizeFinalResponse } from "../contracts/responseContract"
import { PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { analyzeTurn } from "../orchestration/analyzeTurn"
import { applyPolicy, detectClosingText, detectDirectContactRequest, detectPracticalKeywords, computeRollingArousal } from "../orchestration/applyPolicy"
import { detectClientSignals } from "./clientDetection"
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

// --- Analysis fallback ---

function buildDefaultAnalysis(userText: string, previousTopic?: string, forcedMode?: Exclude<PromptMode, "closing">): TurnAnalysis {
  if (detectClosingText(userText)) {
    return {
      intent: "social_closing", proposed_mode: "closing", conversation_move: "close",
      investigation_focus: "none", response_goal: "close_briefly", relational_state: "gentle_close",
      routing_intent: "none", is_history_query: false, topic: previousTopic, sensitivity: "low", signals: ["soft_closing"], confidence: 0.98,
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
      routing_intent: "none", is_history_query: false, topic: previousTopic, sensitivity: "medium", signals: ["forced_mode"], confidence: 0.95,
    }
  }

  // Neutral fallback — LLM fejlede, vis info-svar uden at gætte på intent
  return {
    intent: "understand_method", proposed_mode: "info", conversation_move: "direct_answer",
    investigation_focus: "none", response_goal: "answer_directly", relational_state: "orienting",
    routing_intent: "none", is_history_query: false, topic: previousTopic, sensitivity: "low",
    signals: ["llm_fallback"], confidence: 0.3,
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
  arousalScore?: number
  arousalLevel?: import("../orchestration/applyPolicy").ArousalLevel
}): Record<string, unknown> {
  const previousTranscript = readTranscriptByKey(params.context, params.transcriptKey)
  const prevAssistantCount = countAssistantTurns(previousTranscript)
  const nextAssistantCount = params.assistantMessage ? prevAssistantCount + 1 : prevAssistantCount

  const dialogStage = params.mode === "closing" ? "close" : params.mode === "reflection" ? "explore_patterns" : "open"
  // Topic-tags og problem-titel/-summary: brug LLM-analysens data direkte
  const derivedTopicTags = params.topic ? [params.topic] : []
  const derivedProblemTitle = params.analysis.topic ?? params.topic
  const derivedProblemSummary = params.analysis.objective ?? (params.topic ? `Ønske om at forstå mønstre relateret til ${params.topic}.` : undefined)

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
  if (typeof params.arousalScore === "number") meta["wot.arousal_score"] = params.arousalScore
  if (params.arousalLevel) meta["wot.arousal_level"] = params.arousalLevel

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

  // ─── Klientgenkendelse ──────────────────────────────────────────────────────
  // Detektér implicitte signaler fra eksisterende klienter og rout til
  // CLIENT_SUPPORT — uden at brugeren skal navigere manuelt.
  // Kun aktiv fra GEN_HYPNO (stayOnNode === "GEN_HYPNO").
  if (options.stayOnNode === "GEN_HYPNO") {
    const clientResult = detectClientSignals(userText, transcript)
    if (clientResult.isClient) {
      const assistant = "Hej igen. Hvad er der på hjerte siden sidst — eller er der noget fra sessionen du vil tale nærmere om?"
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "CLIENT_SUPPORT",
          reason: `gen-hypno:client-detected (confidence:${clientResult.confidence}, signals:${clientResult.signals.join(",")})`,
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
            mode: "info", relationalState: "building_trust",
          }),
        },
        debug: { capability: "unified-hypno-v4", used_fallback: false },
      }
    }
  }

  // ─── Analyse ────────────────────────────────────────────────────────────────
  // Kør analyzeTurn FØR routing — LLM'en klassificerer routing_intent i kontekst.
  // Det eliminerer keyword-lister og negerings-fraser.
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

  // ─── LLM-drevet routing ────────────────────────────────────────────────────
  // routing_intent sættes af analyzeTurn. Kun aktiv fra GEN_HYPNO.
  if (options.stayOnNode === "GEN_HYPNO" && analysis.routing_intent !== "none") {
    if (analysis.routing_intent === "contact_booking") {
      const assistant = "Det lyder som om du er klar til at komme i gang. Udfyld nedenstående — Jan kontakter dig inden for 24 timer for at aftale en første session."
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "HANDOFF_FORM",
          reason: "gen-hypno:routing_intent:contact_booking",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis, mode: "practical", relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-hypno-v4", used_fallback: false },
      }
    }

    if (analysis.routing_intent === "booking_info") {
      const assistant = "Du finder kontaktinfo og praktiske detaljer herunder."
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "BOOKING",
          reason: "gen-hypno:routing_intent:booking_info",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis, mode: "practical", relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-hypno-v4", used_fallback: false },
      }
    }

    if (analysis.routing_intent === "lead_capture") {
      const assistant = "Ingen stress — du behøver ikke beslutte dig nu. Efterlad din email, så sender Jan en kort besked om hvad en første session typisk indebærer."
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "LEAD_CAPTURE",
          reason: "gen-hypno:routing_intent:lead_capture",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis, mode: "practical", relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-hypno-v4", used_fallback: false },
      }
    }

    if (analysis.routing_intent === "fit_check") {
      const assistant = "Hvad er det primære, du ønsker at arbejde med?"
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "PREQUALIFY",
          reason: "gen-hypno:routing_intent:fit_check",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis, mode: "info", relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-hypno-v4", used_fallback: false },
      }
    }
  }

  // ─── Hukommelse-forespørgsel ───────────────────────────────────────────────
  // Brugeren spørger ind til hvad de har delt.
  // Har contextPack reelt indhold, lader vi LLM formulere svaret direkte.
  if (analysis.is_history_query) {
    const cp = context.contextPack?.system ?? ""
    const hasContext = cp.length > 200

    let assistant: string

    if (hasContext) {
      try {
        const raw = await llm.chatJson({
          model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Du er den digitale assistent for Jan Lauridsen, hypnoterapeut på Gaarsdal. Brugeren spørger hvad du ved om dem ud fra tidligere samtaler.\n\nBrug KUN den kontekst der er givet nedenfor. Svar specifikt på brugerens spørgsmål — hvis de spørger om et bestemt emne (fx kone, alkohol, søvn), svar kun om det. Vær konkret og ærlig — si eksplicit hvis noget IKKE er nævnt i konteksten. Max 3-4 sætninger. Afslut med ét åbent spørgsmål.\n\nSvar KUN med JSON: { \"assistant_message\": \"...\" }\n\nKONTEKST FRA TIDLIGERE SAMTALER:\n" + cp.slice(0, 2000),
            },
            { role: "user", content: userText },
          ],
        })
        const msg = typeof raw?.assistant_message === "string" ? (raw.assistant_message as string).trim() : null
        assistant = msg && msg.length > 10 ? msg : "Jeg kan se du har delt en del om dine vaner og mønstre. Er der noget bestemt du vil have mig til at uddybe?"
      } catch {
        assistant = "Jeg kan se du har delt en del om dine vaner og mønstre. Er der noget bestemt du vil have mig til at uddybe?"
      }
    } else {
      assistant = "Vi er lige startet, så jeg har ikke meget at trække på endnu — men det ændrer sig hurtigt jo mere vi taler.\n\nEr der noget bestemt du gerne vil have mig til at holde fast i?"
    }

    const updatedTranscript = appendTranscript(transcript, userText, assistant)

    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "gen-hypno:history_query",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context, assistantMessage: assistant, updatedTranscript,
          topic: previousTopic, sourceNode: options.sourceNode,
          transcriptKey: options.transcriptKey, userText,
          analysis: { ...analysis, proposed_mode: "info", conversation_move: "direct_answer" },
          mode: "info", relationalState: "building_clarity",
        }),
      },
      debug: { capability: "unified-hypno-v4", used_fallback: false },
    }
  }

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

  // ── Window of Tolerance ────────────────────────────────────────────────────
  const previousArousalScore =
    typeof (context.state.meta?.["wot.arousal_score"] as any)?.value === "number"
      ? (context.state.meta["wot.arousal_score"] as any).value as number
      : 0
  const arousal = computeRollingArousal(trimmedTranscript, userText, previousArousalScore)

  const policy = applyPolicy({ userText, analysis, transcript: trimmedTranscript, arousalLevel: arousal.level })
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
        // Filtrer parsed.topic fra hvis LLM returnerede en investigation_focus-værdi
        // som topic (fx "regulation", "attention", "pattern") — brug i stedet userText-detektion
        const INVESTIGATION_FOCUS_VALUES = ["attention", "interpretation", "regulation", "pattern", "preparation", "none"]
        const parsedTopicIsValid = parsed.topic && !INVESTIGATION_FOCUS_VALUES.includes(parsed.topic.toLowerCase())
        responseTopic = parsedTopicIsValid ? parsed.topic : responseTopic
        responseObjective = parsed.objective ?? responseObjective
        modeUsed = parsed.mode_used
      }
    } catch {
      usedFallback = true
    }
  }

  // Topic-prioritering (kun LLM-kilder — ingen keyword-regex):
  // 1. responseTopic fra LLM's response-kontrakt
  // 2. analysis.topic fra analyzeTurn
  // 3. previousTopic som absolut fallback
  const rawAnalysisTopic = analysis.topic && !["regulation", "attention", "pattern", "preparation", "interpretation", "none"].includes(analysis.topic.toLowerCase())
    ? analysis.topic
    : undefined
  const topic = responseTopic || rawAnalysisTopic || previousTopic

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
    analysis.intent !== "social_closing"

  if (ctaConditionsMet) {
    assistant = assistant + "\n\nHvis du vil vide mere om hvad et konkret forløb indebærer, er du velkommen til at skrive det — eller tage kontakt til Jan direkte."
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
          arousalScore: arousal.score,
          arousalLevel: arousal.level,
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
