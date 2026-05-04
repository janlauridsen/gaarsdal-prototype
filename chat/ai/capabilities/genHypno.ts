import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { computeRollingArousal, detectPracticalKeywords, detectClosingText, detectReadinessSignal, detectChildContext } from "../orchestration/applyPolicy"
// detectPracticalKeywords + detectClosingText used as upstream policy signals (not post-hoc overrides)
import { detectClientSignals } from "./clientDetection"
import { singleTurnCall, buildSingleTurnFallback, SingleTurnOutput } from "../orchestration/singleTurnCall"

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
  return {
    intent: forcedMode === "reflection" ? "explore_pattern" : forcedMode === "evidence" ? "ask_evidence" : "understand_method",
    proposed_mode: forcedMode ?? "info",
    conversation_move: forcedMode === "reflection" ? "guided_observation" : forcedMode === "practical" ? "practical_preparation" : "direct_answer",
    investigation_focus: forcedMode === "reflection" ? "attention" : forcedMode === "practical" ? "preparation" : "none",
    response_goal: forcedMode ? "answer_then_one_question" : "answer_directly",
    relational_state: forcedMode === "reflection" ? "building_trust" : forcedMode === "practical" ? "decision_support" : "orienting",
    routing_intent: "none", is_history_query: false, topic: previousTopic, sensitivity: "low",
    signals: ["fallback"], confidence: 0.3,
  }
}

// Konverterer SingleTurnOutput til TurnAnalysis for buildMetaDelta-kompatibilitet
function outputToAnalysis(out: SingleTurnOutput, previousTopic?: string): TurnAnalysis {
  return {
    intent: "understand_method",
    proposed_mode: out.mode_used,
    conversation_move: out.conversation_move,
    investigation_focus: out.investigation_focus,
    response_goal: "answer_then_one_question",
    relational_state: out.relational_state,
    routing_intent: "none",
    is_history_query: out.is_history_query,
    topic: out.topic ?? previousTopic,
    objective: out.objective,
    sensitivity: "low",
    signals: out.signals,
    confidence: out.confidence,
  }
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

  const dialogStage =
    params.mode === "closing" ? "close"
    : prevAssistantCount <= 1 ? "open"
    : prevAssistantCount <= 3 ? "deepening"
    : "closing"
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
  }
  if (params.mode !== "closing") {
    meta["focused_reflection.transcript"] = params.updatedTranscript
  }
  if (params.mode === "closing") meta["focused_reflection.stage"] = "CLOSED"
  if (derivedProblemTitle) meta["gen_hypno.problem_title"] = derivedProblemTitle
  if (derivedProblemSummary) meta["gen_hypno.problem_summary"] = derivedProblemSummary
  if (derivedTopicTags.length) meta["gen_hypno.topic_tags"] = derivedTopicTags
  if (typeof params.arousalScore === "number") meta["wot.arousal_score"] = params.arousalScore
  if (params.arousalLevel) meta["wot.arousal_level"] = params.arousalLevel
  // model logges fra capability niveau, ikke her

  return meta
}

// ─── Krise-fraser ─────────────────────────────────────────────────────────────

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

  // ─── Window of Tolerance (kører FØR LLM-kald så arousal sendes med) ─────────
  const previousArousalScore =
    typeof (context.state.meta?.["wot.arousal_score"] as any)?.value === "number"
      ? (context.state.meta["wot.arousal_score"] as any).value as number
      : 0
  const arousal = computeRollingArousal(trimmedTranscript, userText, previousArousalScore)

  // B: læs forrige turns mode og relational_state til sekvens-kontekst
  // Nulstil sekvens-kontekst når samtalen er i lukket/afsluttende tilstand
  // og brugeren sender et nyt substantielt input.
  // Dækker mode="closing", stage="closing", move="close" — alle låser LLM i lukke-tone.
  const rawPreviousMode = readStringMeta(context, "dialog.mode") as PromptMode | undefined
  const rawPreviousRelationalState = readStringMeta(context, "dialog.relational_state") as import("../contracts/turnAnalysis").RelationalState | undefined
  const rawPreviousDialogStage = readStringMeta(context, "dialog.stage")
  const rawPreviousDialogMove = readStringMeta(context, "dialog.move")

  const isReopeningAfterClose = (
    rawPreviousMode === "closing" ||
    rawPreviousDialogStage === "closing" ||
    rawPreviousDialogMove === "close"
  ) && userText.trim().length > 10
  const previousMode = isReopeningAfterClose ? undefined : rawPreviousMode
  const previousRelationalState = isReopeningAfterClose ? undefined : rawPreviousRelationalState

  // ─── Kombineret enkelt LLM-kald ───────────────────────────────────────────
  // Erstatter det gamle to-kaldede system (analyzeTurn + response).
  // LLM'en bestemmer routing, mode og skriver svaret i ét JSON-output.
  const assistantCountBefore = countAssistantTurns(transcript)

  // Hvis topic er sat af greeting-systemet (SYSTEM_THREAD_CREATE) og brugeren spørger om historik,
  // injicér greeting-kontekst så LLM'en ikke modsiger velkomstbeskeden.
  const lastTopicSourceNode = (context.state.meta?.["gen_hypno.last_topic"] as any)?.source_node
  const greetingHint =
    lastTopicSourceNode === "SYSTEM_THREAD_CREATE" && previousTopic
      ? `\n\nNOTE: Brugeren blev budt velkommen med en hilsen der refererede til emnet "${previousTopic}" fra en tidligere samtale. Bekræft dette emne hvis brugeren spørger om historik — svar IKKE at der ingen historik er.`
      : undefined

  // A: Beregn policy-signaler her og send dem med som input til LLM (upstream hints, ikke post-hoc override)
  const policySignals = {
    is_practical_request: detectPracticalKeywords(userText),
    is_closing: detectClosingText(userText),
    is_ready_signal: detectReadinessSignal(userText),
    is_child_context: detectChildContext(userText, trimmedTranscript),
  }

  // ─── Forløb-invitation: route til BOOKING når bruger bekræfter ────────────
  // Detekteres deterministisk: forrige assistent-besked indeholdt invitation om forløb
  // OG brugerens svar er et bekræftende signal (ja, gerne, etc.)
  if (
    options.stayOnNode === "GEN_HYPNO" &&
    policySignals.is_ready_signal
  ) {
    const lastAssistant = lastAssistantExcerpt(trimmedTranscript)
    const invitationShown =
      lastAssistant &&
      (lastAssistant.includes("forløb") || lastAssistant.includes("tage det videre") || lastAssistant.includes("høre mere"))
    if (invitationShown) {
      const bookingNode = "BOOKING"
      const assistant = "Du kan kontakte Jan direkte:\n\n📞 +45 42 80 74 74\n✉️ jan@gaarsdal.net\n📍 Bakkevej 36, 3460 Birkerød\n\nDu kan også sende en besked via kontaktformularen på hjemmesiden.\n\nEn første samtale er uforpligtende — du kan stille spørgsmål og mærke om det giver mening for dig."
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: bookingNode,
          reason: "gen-hypno:forloeb-invitation-confirmed",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context, assistantMessage: assistant, updatedTranscript, topic: previousTopic,
            sourceNode: options.sourceNode, transcriptKey: options.transcriptKey, userText,
            analysis: buildDefaultAnalysis(userText, previousTopic, "practical"),
            mode: "practical", relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-hypno-v5-single", used_fallback: false },
      }
    }
  }

  // Crisis-flag: tjek både meta (sat af chat.ts på forrige turn) og brugerens aktuelle tekst
  const crisisInMeta = (context.state.meta?.["safety.crisis_detected"] as any)?.value === true
  const CRISIS_PHRASES_GENHYPNO = [
    "gøre mig selv ondt", "slå mig selv", "skade mig selv",
    "vil ikke leve", "ikke leve mere", "ikke her mere",
    "tage mit eget liv", "ende det hele", "selvmord", "selvskade",
    "ingen vej ud", "nogen vej ud", "ingen udvej", "nogen udvej",
    "ikke lyst til at leve", "ingen grund til at fortsætte",
    "lyst til at give op", "lyst til at slippe for det hele",
    "slippe for det hele", "ville være lettere hvis jeg ikke var her",
  ]
  const crisisInText = CRISIS_PHRASES_GENHYPNO.some((p) => userText.toLowerCase().includes(p))
  const crisisDetected = crisisInMeta || crisisInText

  let turnOutput = await singleTurnCall({
    llm,
    transcript: trimmedTranscript,
    userText,
    lastTopic: previousTopic,
    arousalLevel: arousal.level,
    assistantCount: assistantCountBefore,
    contextPackSystem: greetingHint
      ? (context.contextPack?.system ?? "") + greetingHint
      : context.contextPack?.system,
    userProfileSystem: context.contextPack?.user_profile,
    previousMode,
    previousRelationalState,
    policySignals,
    goalHypothesis: context.contextPack?.goal_hypothesis,
    modelOverride: context.modelOverride,
    rhetoricalInstruction: context.contextPack?.rhetorical_instruction,
    crisisDetected,
  })

  const usedFallback = !turnOutput
  if (!turnOutput) {
    turnOutput = buildSingleTurnFallback(userText, previousTopic)
  }

  // Konvertér til TurnAnalysis for buildMetaDelta-kompatibilitet
  let analysis = outputToAnalysis(turnOutput, previousTopic)

  // ─── Hukommelse-forespørgsel ───────────────────────────────────────────────
  // Kun aktiv når LLM siger is_history_query OG der faktisk er noget at rapportere.
  // Uden kontekst (hverken LTM eller session) returnerer vi IKKE den ubrugelige
  // "Vi er lige startet"-besked — vi falder igennem til normal dialog i stedet.
  if (turnOutput.is_history_query) {
    const cp = context.contextPack?.system ?? ""
    const hasLtmContext = cp.length > 200
    const sessionTurns = trimmedTranscript.filter(t => t.role === "assistant").length
    const hasSessionContext = sessionTurns >= 2
    const handoffDone = !!(context.state.meta?.["handoff.last"] as any)?.value

    // Ingen kontekst at give → ignorér is_history_query og behandl som normal tur
    if (!hasLtmContext && !hasSessionContext) {
      turnOutput = { ...turnOutput, is_history_query: false }
    } else {
      let assistant: string

      if (hasLtmContext) {
        try {
          const raw = await llm.chatJson({
            model: context.modelOverride ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "Du er den digitale assistent for Jan Lauridsen, hypnoterapeut på Gaarsdal. Brugeren spørger hvad du ved om dem ud fra tidligere samtaler.\n\nBrug KUN den kontekst der er givet nedenfor. Svar specifikt på brugerens spørgsmål. Vær konkret og ærlig — si eksplicit hvis noget IKKE er nævnt. Max 3-4 sætninger. Afslut med ét åbent spørgsmål.\n\nSvar KUN med JSON: { \"assistant_message\": \"...\" }\n\nKONTEKST:\n" + cp.slice(0, 2000),
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
        const topicStr = previousTopic ? ` om ${previousTopic}` : ""
        const handoffStr = handoffDone ? " Du har også sendt en henvendelse til Jan." : ""
        assistant = `I denne samtale har vi talt${topicStr}.${handoffStr} Jeg husker hvad vi er kommet igennem her, men har endnu ikke adgang til evt. tidligere samtaler.\n\nEr der noget bestemt du vil vende tilbage til?`
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
        debug: { capability: "unified-hypno-v5-single", used_fallback: false },
      }
    }
  }

  // ─── Normal svar-sti ──────────────────────────────────────────────────────
  const modeUsed = turnOutput.mode_used
  const topic = turnOutput.topic || previousTopic
  const assistant = turnOutput.assistant_message

  const updatedTranscript = appendTranscript(transcript, userText, assistant)

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
          analysis, mode: modeUsed, objective: turnOutput.objective,
          relationalState: analysis.relational_state,
          arousalScore: arousal.score,
          arousalLevel: arousal.level,
        }),
        "gen_hypno.model": context.modelOverride ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      },
    },
    debug: { capability: "unified-hypno-v5-single", used_fallback: usedFallback },
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
