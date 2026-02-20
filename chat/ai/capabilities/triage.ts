import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmChatInput,
  LlmClient,
} from "../types"

type Relevance = "YES" | "LIKELY" | "UNCLEAR" | "NO"
type NextState = "OPEN" | "MARK" | "EXPLORE" | "CONFIRM" | "CLOSE"
type TranscriptRole = "user" | "assistant"

type TranscriptTurn = {
  role: TranscriptRole
  content: string
}

type Decision = {
  relevance: Relevance
  topic_tags: string[]
  user_goal: string
  key_triggers: string[]
  time_horizon: string
  confidence: number
  next_state: NextState
  notes_for_context: string
}

type Render = {
  assistant_message: string
  next_question: string
  chips: Array<{ id: string; label: string }>
}

type Outcome = {
  relevance: Relevance
  confidence: number
  next_state: NextState
  next_node: string
  question_count: number
}

type TriageOutput = {
  decision: Decision
  render: Render
}

const MAX_TEXT = 260
const MAX_TRANSCRIPT_ENTRIES = 10
const MAX_QUESTIONS = 5

const TRIAGE_PROMPT = `Du er en TRIAGE-assistent, der udelukkende vurderer hypnoterapi-relevans.

SCOPE (hard rule):
- Du må kun arbejde med: “Kan det her typisk håndteres med hypnoterapi?”
- Alt andet (smalltalk, generel coaching, rådgivning uden triage-formål) skal afvises høfligt
  og nudges tilbage til triage-sporet ved at bede brugeren beskrive et problem/ønske.

Vigtige afgrænsninger:
- Du må ikke diagnosticere eller risikovurdere medicinsk/psykiatrisk.
- Du må ikke give behandlingsråd, øvelser eller konkrete løsninger.
- Du må gerne normalisere i korte, generelle vendinger (fx “mange opsøger hypnose for …”),
  men uden garantier, klinisk præcision, eller faglig debat.

KONTEKST:
- Du får conversation_transcript (bounded) med tidligere udvekslinger.
- Du får question_budget: { used, max, remaining } og close_signal.
- Du skal holde dialogen sammenhængende ud fra transcript.

SPØRGSMÅL-BUDGET (hard rule):
- Du må maks stille max spørgsmål (se question_budget.max) i alt.
- Kun faktiske afklarende spørgsmål tæller (de skal stå i render.next_question).
- Hvis der er nok viden før budget: stop med at spørge og giv konklusion.
- Hvis budget er opbrugt: luk afklaringssporet og giv bedste vurdering.

TIDLIG KONKLUSION (hard rule):
- Hvis relevance er YES eller LIKELY: sig eksplicit at det brugeren beskriver typisk er noget
  man arbejder med i hypnoterapi.
- Når relevance er YES eller LIKELY: next_question SKAL være tom og next_state SKAL være CLOSE.

NO med sekundær relevans:
- Hvis kerneproblemet typisk ikke løses af hypnose direkte: forklar kort at hypnose sjældent
  ændrer X direkte, men kan være relevant for 1–2 sekundære mål (stressrespons, søvn, triggere,
  mestring, vanemønstre). Hold det kort og ikke-behandlende.

EVIDENS / “er det normalt?” (kort svar):
- Svar på generelt niveau i 2–4 sætninger. Ingen garantier. Ingen klinisk diagnostik.

CHIPS (hard rule):
- Max 2–3 chips.
- Kun til præcis afklaring (før konklusion) eller korte info-spørgsmål (efter konklusion).
- Chips må ikke styre navigation eller booking.

KRITISK SAMTALEREGEL (hard rule):
- Du må ALDRIG stille et spørgsmål uden først at kvittere og anerkende brugerens oplevelse.
- assistant_message SKAL altid indeholde:
  1) en kort spejling/anerkendelse
  2) en relevansramme
- assistant_message må aldrig kun bestå af et spørgsmål.

Returner KUN gyldig JSON i formatet:
{
  "decision": {
    "relevance": "YES" | "LIKELY" | "UNCLEAR" | "NO",
    "topic_tags": string[],
    "user_goal": string,
    "key_triggers": string[],
    "time_horizon": string,
    "confidence": number,
    "next_state": "OPEN" | "MARK" | "EXPLORE" | "CONFIRM" | "CLOSE",
    "notes_for_context": string
  },
  "render": {
    "assistant_message": string,
    "next_question": string,
    "chips": { "id": string, "label": string }[]
  }
}`

const DEFAULT_CHIPS: Array<{ id: string; label: string }> = []

function writeMeta(
  context: AiCapabilityContext,
  domain: string,
  value: unknown
): void {
  context.state.meta[domain] = {
    value,
    source_node: context.state.active_node,
  }
}

function countFromMeta(context: AiCapabilityContext): number {
  const raw = context.state.meta["triage.question_count"]?.value
  return typeof raw === "number" ? raw : 0
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v) => typeof v === "string")
}

function normalizeRelevance(value: unknown): Relevance {
  if (
    value === "YES" ||
    value === "LIKELY" ||
    value === "UNCLEAR" ||
    value === "NO"
  ) {
    return value
  }
  return "UNCLEAR"
}

function normalizeNextState(value: unknown): NextState {
  if (
    value === "OPEN" ||
    value === "MARK" ||
    value === "EXPLORE" ||
    value === "CONFIRM" ||
    value === "CLOSE"
  ) {
    return value
  }
  return "EXPLORE"
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== "number") return 0.5
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function includesQuestionOnly(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.endsWith("?") && !trimmed.includes(". ")
}

function clamp(s: string, max: number): string {
  const t = (s ?? "").trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + "…"
}

function normalizeTranscriptEntry(value: unknown): TranscriptTurn | null {
  if (!value || typeof value !== "object") return null
  const obj = value as Record<string, unknown>
  const role = obj.role
  const content = obj.content
  if (role !== "user" && role !== "assistant") return null
  if (typeof content !== "string") return null
  const c = clamp(content, MAX_TEXT)
  if (!c.trim()) return null
  return { role, content: c }
}

function readBoundedTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["dialog.triage.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const out: TranscriptTurn[] = []
  for (const item of raw) {
    const t = normalizeTranscriptEntry(item)
    if (t) out.push(t)
  }
  return out.slice(-MAX_TRANSCRIPT_ENTRIES)
}

function buildAssistantText(render: Render): string {
  const parts = [render.assistant_message.trim()]
  if (render.next_question.trim()) {
    parts.push(render.next_question.trim())
  }
  return parts.filter(Boolean).join("\n\n")
}

function appendToTranscript(params: {
  transcript: TranscriptTurn[]
  userText: string
  assistantText: string
}): TranscriptTurn[] {
  const next: TranscriptTurn[] = [...(params.transcript ?? [])]
  const u = clamp(params.userText ?? "", MAX_TEXT)
  const a = clamp(params.assistantText ?? "", MAX_TEXT)
  if (u.trim()) next.push({ role: "user", content: u.trim() })
  if (a.trim()) next.push({ role: "assistant", content: a.trim() })
  return next.slice(-MAX_TRANSCRIPT_ENTRIES)
}

function enforceMessagePolicy(output: TriageOutput): TriageOutput {
  const isRelevant =
    output.decision.relevance === "YES" || output.decision.relevance === "LIKELY"
  const relevanceHint = isRelevant
    ? "Det, du beskriver, er relevant for hypnoterapi."
    : "Tak for at dele det."

  if (isRelevant) {
    output = {
      ...output,
      render: {
        ...output.render,
        assistant_message: output.render.assistant_message
          ? output.render.assistant_message
          : relevanceHint,
      },
    }
  } else if (!output.render.assistant_message) {
    output = {
      ...output,
      render: {
        ...output.render,
        assistant_message: relevanceHint,
      },
    }
  }

  if (includesQuestionOnly(output.render.assistant_message)) {
    output = {
      ...output,
      render: {
        ...output.render,
        assistant_message: `${relevanceHint} ${output.render.assistant_message}`.trim(),
      },
    }
  }

  return output
}

function normalizeOutput(raw: Record<string, unknown>, context: AiCapabilityContext): TriageOutput {
  const decision = (raw.decision ?? {}) as Record<string, unknown>
  const render = (raw.render ?? {}) as Record<string, unknown>

  const output: TriageOutput = {
    decision: {
      relevance: normalizeRelevance(decision.relevance),
      topic_tags: toStringArray(decision.topic_tags),
      user_goal: typeof decision.user_goal === "string" ? decision.user_goal : "",
      key_triggers: toStringArray(decision.key_triggers),
      time_horizon: typeof decision.time_horizon === "string" ? decision.time_horizon : "",
      confidence: normalizeConfidence(decision.confidence),
      next_state: normalizeNextState(decision.next_state),
      notes_for_context: typeof decision.notes_for_context === "string" ? decision.notes_for_context : "",
    },
    render: {
      assistant_message: typeof render.assistant_message === "string" ? render.assistant_message : "",
      next_question: typeof render.next_question === "string" ? render.next_question : "",
      chips: Array.isArray(render.chips) ? (render.chips as any[]).filter(Boolean) : [],
    },
  }

  // Ensure chips have id/label shape; fallback if not.
  const chips = output.render.chips
    .map((c: any) => ({
      id: typeof c?.id === "string" ? c.id : "",
      label: typeof c?.label === "string" ? c.label : "",
    }))
    .filter((c) => c.id && c.label)

  output.render.chips = chips.length ? chips : DEFAULT_CHIPS

  return enforceMessagePolicy(output)
}

function buildFallbackOutput(context: AiCapabilityContext): TriageOutput {
  return enforceMessagePolicy({
    decision: {
      relevance: "UNCLEAR",
      topic_tags: [],
      user_goal: "",
      key_triggers: [],
      time_horizon: "",
      confidence: 0.35,
      next_state: "EXPLORE",
      notes_for_context: "",
    },
    render: {
      assistant_message: "Tak for at dele det. Jeg vil gerne forstå lidt mere, så jeg kan svare ordentligt.",
      next_question: "Hvad håber du at kunne ændre eller få hjælp til?",
      chips: DEFAULT_CHIPS,
    },
  })
}

function countsAsClarifyingQuestion(output: TriageOutput): boolean {
  const q = (output?.render?.next_question ?? "").trim()
  if (!q) return false
  // We only count explicit clarifying questions carried in next_question.
  return q.includes("?")
}

function trimChips(chips: Array<{ id: string; label: string }>, max = 3) {
  return (chips ?? []).filter(Boolean).slice(0, max)
}

function deriveContextualChips(params: {
  output: TriageOutput
  questionRemaining: number
}): Array<{ id: string; label: string }> {
  const rel = params.output.decision.relevance
  const isRelevant = rel === "YES" || rel === "LIKELY"

  if (isRelevant) {
    return trimChips([
      { id: "evidence", label: "Er der evidens?" },
      { id: "normal", label: "Er det normalt?" },
    ])
  }

  // Before conclusion: only provide precise clarification choices if it helps.
  // The only safe generic clarification we can offer without steering is time horizon.
  const missing = deriveUnclearPoints(params.output)
  if (params.questionRemaining > 0 && missing.includes("time_horizon")) {
    return trimChips([
      { id: "t_lt_1m", label: "Under 1 måned" },
      { id: "t_1_6m", label: "1–6 måneder" },
      { id: "t_gt_6m", label: "Over 6 måneder" },
    ])
  }

  return []
}

function enforceBudgetsAndScope(params: {
  context: AiCapabilityContext
  output: TriageOutput
  questionUsed: number
  questionRemaining: number
}): { output: TriageOutput; questionUsed: number; closeSignal: boolean } {
  let { output } = params
  let used = params.questionUsed

  const isRelevant = output.decision.relevance === "YES" || output.decision.relevance === "LIKELY"

  // If already relevant: no more questions.
  if (isRelevant) {
    output = {
      ...output,
      decision: { ...output.decision, next_state: "CLOSE" },
      render: { ...output.render, next_question: "" },
    }
  }

  // Hard budget: if no remaining questions, force-close any question.
  if (params.questionRemaining <= 0) {
    output = {
      ...output,
      decision: { ...output.decision, next_state: "CLOSE" },
      render: { ...output.render, next_question: "" },
    }
  }

  const asked = countsAsClarifyingQuestion(output)
  if (asked && params.questionRemaining > 0 && !isRelevant) {
    used = used + 1
  } else {
    // Ensure we don't accidentally count or keep a non-budget-compliant question.
    if (asked && (params.questionRemaining <= 0 || isRelevant)) {
      output = { ...output, render: { ...output.render, next_question: "" } }
    }
  }

  // Chip hard rules.
  const remainingNow = Math.max(0, MAX_QUESTIONS - used)
  const chips = deriveContextualChips({ output, questionRemaining: remainingNow })
  output = { ...output, render: { ...output.render, chips } }

  const closeSignal =
    output.decision.next_state === "CLOSE" || isRelevant || params.questionRemaining <= 0

  return { output, questionUsed: used, closeSignal }
}

function writeMetaDecision(context: AiCapabilityContext, output: TriageOutput, questionCount: number): void {
  writeMeta(context, "triage.relevance", output.decision.relevance)
  writeMeta(context, "triage.topic_tags", output.decision.topic_tags)
  writeMeta(context, "triage.user_goal", output.decision.user_goal)
  writeMeta(context, "triage.key_triggers", output.decision.key_triggers)
  writeMeta(context, "triage.time_horizon", output.decision.time_horizon)
  writeMeta(context, "triage.confidence", output.decision.confidence)
  writeMeta(context, "triage.next_state", output.decision.next_state)
  writeMeta(context, "triage.notes_for_context", output.decision.notes_for_context)
  writeMeta(context, "triage.question_count", questionCount)
}

function deriveUnclearPoints(output: TriageOutput): string[] {
  const missing: string[] = []
  if (!output.decision.user_goal.trim()) missing.push("user_goal")
  if (!output.decision.topic_tags.length) missing.push("topic_tags")
  if (!output.decision.key_triggers.length) missing.push("key_triggers")
  if (!output.decision.time_horizon.trim()) missing.push("time_horizon")
  return missing.slice(0, 6)
}

function deriveSummary(output: TriageOutput): string {
  const note = (output.decision.notes_for_context ?? "").trim()
  if (note) return clamp(note, 420)
  const goal = (output.decision.user_goal ?? "").trim()
  if (goal) return clamp(goal, 420)
  return ""
}

function writeMetaRenderAndOutcome(params: {
  context: AiCapabilityContext
  output: TriageOutput
  questionCount: number
  nextNode: string
  closeSignal: boolean
  transcript: TranscriptTurn[]
}): void {
  const { context, output, questionCount, nextNode, closeSignal, transcript } = params

  // UI hints (already declared in registry and consumed by the UI/consolidation).
  writeMeta(context, "triage.next_question", output.render.next_question)
  writeMeta(context, "triage.chips", output.render.chips)

  // Minimal snapshot signals used by memory/event capture.
  writeMeta(context, "triage.summary", deriveSummary(output))
  writeMeta(context, "triage.unclear_points", deriveUnclearPoints(output))
  writeMeta(context, "triage.close_signal", closeSignal)
  writeMeta(context, "dialog.triage.transcript", transcript)

  const outcome: Outcome = {
    relevance: output.decision.relevance,
    confidence: output.decision.confidence,
    next_state: output.decision.next_state,
    next_node: nextNode,
    question_count: questionCount,
  }
  writeMeta(context, "triage.outcome", outcome)
}

function detectThemeCandidate(params: {
  userText: string
  topicTags: string[]
}): { id: string; label: string; confidence: number } | null {
  const text = (params.userText ?? "").toLowerCase()
  const tags = (params.topicTags ?? []).map((t) => String(t).toLowerCase())

  const alcoholSignals = ["alkohol", "vin", "øl", "bajer", "drik", "drikker", "fuld", "beruset"]
  const hitsText = alcoholSignals.some((w) => text.includes(w))
  const hitsTags = tags.some((t) => t.includes("alkohol"))

  if (hitsText || hitsTags) {
    return { id: "alkohol", label: "Alkohol", confidence: hitsTags ? 0.85 : 0.78 }
  }

  // v23: no other explicit theme routing yet
  return null
}

function writeMemoryCandidates(context: AiCapabilityContext, output: TriageOutput): void {
  const theme = detectThemeCandidate({ userText: context.userText, topicTags: output.decision.topic_tags })
  if (theme) {
    writeMeta(context, "memory_candidates.theme", theme)
  }

  if (output.decision.user_goal.trim()) {
    writeMeta(context, "memory_candidates.goal", {
      text: clamp(output.decision.user_goal, 240),
      source: "triage",
    })
  }

  if (output.decision.key_triggers.length) {
    writeMeta(context, "memory_candidates.triggers", output.decision.key_triggers.slice(0, 10))
  }

  // v23: patterns are not extracted yet; keep explicit empty to enable future evolution.
  writeMeta(context, "memory_candidates.patterns", [])

  if (output.decision.notes_for_context.trim()) {
    writeMeta(context, "memory_candidates.summary", clamp(output.decision.notes_for_context, 420))
  }
}

function deriveOutcome(
  output: TriageOutput,
  questionCount: number
): { transition: Transition; nextNode: string } {
  // Decision: TRIAGE never performs navigation/booking. UI controls next actions.
  const nextNode = "TRIAGE"

  // These are also written to state.meta via writeMeta* helpers, but we additionally include them
  // in meta_delta so telemetry/spine meta_keys_written reflects the actual triage contract.
  const summary = deriveSummary(output)
  const unclear_points = deriveUnclearPoints(output)
  const outcome: Outcome = {
    relevance: output.decision.relevance,
    confidence: output.decision.confidence,
    next_state: output.decision.next_state,
    next_node: nextNode,
    question_count: questionCount,
  }
  return {
    nextNode,
    transition: {
    type: "NODE_HOP",
    from: "TRIAGE",
    // Stay in TRIAGE. Kernel will normalize `to` to the active node in logs.
    to: undefined,
    reason: `triage: ${output.decision.relevance} (${questionCount})`,
    meta_delta: {
      "triage.decision": output.decision,
      "triage.render": output.render,
      // UI / snapshot keys (declared in registry; consumed by UI, consolidation, memory events)
      "triage.next_question": output.render.next_question,
      "triage.chips": output.render.chips,
      "triage.summary": summary,
      "triage.unclear_points": unclear_points,
      "triage.outcome": outcome,
      // Useful to observe in telemetry even though it's also inside decision/outcome.
      "triage.question_count": questionCount,
      "triage.close_signal": output.decision.next_state === "CLOSE",
    },
    },
  }
}

export const triageCapability: AiCapability = {
  id: "triage-relevance-v1",
  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    const transcript = readBoundedTranscript(context)
    const questionUsed0 = countFromMeta(context)
    const questionRemaining0 = Math.max(0, MAX_QUESTIONS - questionUsed0)
    const closeSignal0 = Boolean(context.state.meta["triage.close_signal"]?.value)

    const contextSystem = (context.contextPack?.system ?? "").trim()

    const payload = {
      model: process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRIAGE_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user",
          content: JSON.stringify({
            conversation_transcript: transcript,
            question_budget: {
              used: questionUsed0,
              max: MAX_QUESTIONS,
              remaining: questionRemaining0,
            },
            close_signal: closeSignal0,
            user_input: context.userText,
          }),
        },
      ],
    } satisfies LlmChatInput

    const response = await llm.chatJson(payload)
    let output = response ? normalizeOutput(response, context) : buildFallbackOutput(context)

    const enforced = enforceBudgetsAndScope({
      context,
      output,
      questionUsed: questionUsed0,
      questionRemaining: questionRemaining0,
    })
    output = enforced.output
    const questionUsed1 = enforced.questionUsed
    const assistantText = buildAssistantText(output.render)

    // Update transcript (bounded) AFTER generating assistant message.
    const transcript1 = appendToTranscript({
      transcript,
      userText: context.userText,
      assistantText,
    })

    // Persist question count (counts only factual clarifying questions).
    writeMeta(context, "triage.question_count", questionUsed1)
    writeMetaDecision(context, output, questionUsed1)

    const outcome = deriveOutcome(output, questionUsed1)

    // Ensure UI & memory snapshot keys declared in registry are actually populated.
    writeMetaRenderAndOutcome({
      context,
      output,
      questionCount: questionUsed1,
      nextNode: outcome.nextNode,
      closeSignal: enforced.closeSignal,
      transcript: transcript1,
    })

    // Emit structured candidates for long-term memory refinement.
    writeMemoryCandidates(context, output)

    return {
      transition: {
        ...outcome.transition,
        response_message: assistantText,
      },
      debug: {
        capability: "triage-relevance-v1",
        used_fallback: !response,
      },
    }
  },
}
