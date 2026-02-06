import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
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

type TriageOutput = {
  decision: Decision
  render: Render
}

const MAX_TRANSCRIPT_TURNS = 16

const TRIAGE_PROMPT = `Du er en relevans-assistent for hypnoterapi.

Dit formål er:
1) at afgøre om hypnoterapi er relevant ud fra brugerens egne oplevelser og ønskede forandringer
2) at returnere relevans + metadata til videre kontekst (state machine, journal, booking)
3) at føre en menneskelig, anerkendende dialog, hvor brugeren føler sig set og hørt

Grundlæggende præmis:
- Relevans må gerne afgøres tidligt.
- Samtalen må aldrig lukkes blot fordi relevans er afgjort.
- Brugeren skal tydeligt kunne mærke, når det de beskriver allerede er relevant.
- Dialogen må ikke udvikle sig til egentlig behandling eller forberedende terapi.

Vigtige afgrænsninger:
- Du må ikke diagnosticere eller risikovurdere medicinsk/psykiatrisk.
- Diagnoser, labels og symptomer er ikke afgørende for relevans.
- Du må ikke give behandlingsråd eller foreslå konkrete løsninger.
- Du må gerne normalisere og rammesætte ud fra erfaring
  (fx “det er et område mange arbejder med i hypnoterapi”),
  men uden årsagsforklaringer, mekanismer eller medicinske vurderinger.

KRITISK SAMTALEREGEL (hard rule):
- Du må ALDRIG stille et spørgsmål uden først at kvittere og anerkende brugerens oplevelse.
- assistant_message SKAL altid indeholde:
  1) en kort spejling/anerkendelse
  2) en relevansramme
- assistant_message må aldrig kun bestå af et spørgsmål.

RELEVANSMARKØR:
- Når relevance er YES eller LIKELY, SKAL du mindst én gang tydeligt formulere,
  at det brugeren beskriver er relevant for hypnoterapi.
- Når relevance er markeret tydeligt,
  skal du IKKE gentage fuld relevansforklaring i hver efterfølgende tur.
  Brug i stedet korte bekræftelser.

AFGRÆNSNING AF SPØRGSMÅL VED RELEVANS:
- Hvis relevance er YES eller LIKELY, må du IKKE stille nye opklarende spørgsmål.
- I stedet: giv kort uddybende svar og henvis til generel information om hypnoterapi.

KONTEKSTSKIFT:
- Hvis brugeren skifter emne markant (nyt problemområde),
  skal assistant_message eksplicit anerkende skiftet før ny relevans vurderes.

DIREKTE RELEVANS-SPØRGSMÅL:
- Hvis brugeren direkte spørger, om hypnoterapi er relevant,
  og relevance vurderes som YES eller LIKELY,
  skal next_state være CONFIRM.

Du får conversation_transcript med tidligere bruger-/assistent-udvekslinger.
Du SKAL bruge den aktivt, så svar husker tidligere kontekst.

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

const DEFAULT_CHIPS = [
  { id: "tell_more", label: "Fortæl mere" },
  { id: "why_relevant", label: "Hvorfor relevant?" },
  { id: "next_steps", label: "Hvad er næste skridt?" },
  { id: "stop", label: "Stop her" },
]

function countFromMeta(context: AiCapabilityContext): number {
  const raw = context.state.meta["triage.question_count"]?.value
  return typeof raw === "number" ? raw : 0
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v) => typeof v === "string")
}

function normalizeRelevance(value: unknown): Relevance {
  if (value === "YES" || value === "LIKELY" || value === "UNCLEAR" || value === "NO") {
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

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["triage.transcript"]?.value
  if (!Array.isArray(raw)) return []

  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as Record<string, unknown>
    if (
      (obj.role === "user" || obj.role === "assistant") &&
      typeof obj.content === "string" &&
      obj.content.trim().length > 0
    ) {
      turns.push({
        role: obj.role,
        content: obj.content.trim(),
      })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function buildAssistantText(render: Render): string {
  const parts = [render.assistant_message.trim()]
  if (render.next_question.trim()) {
    parts.push(render.next_question.trim())
  }
  return parts.filter(Boolean).join("\n\n")
}

function appendTranscript(
  previous: TranscriptTurn[],
  userText: string,
  assistantText: string
): TranscriptTurn[] {
  const next = [...previous]
  const user = userText.trim()
  const assistant = assistantText.trim()

  if (user.length > 0) {
    next.push({ role: "user", content: user })
  }
  if (assistant.length > 0) {
    next.push({ role: "assistant", content: assistant })
  }

  return next.slice(-MAX_TRANSCRIPT_TURNS)
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
        next_question: "",
      },
    }
  }

  let assistantMessage = output.render.assistant_message?.trim() || ""
  if (!assistantMessage || includesQuestionOnly(assistantMessage)) {
    assistantMessage = `Tak fordi du deler det. ${relevanceHint}`
  }

  if (isRelevant && !assistantMessage.toLowerCase().includes("relevant")) {
    assistantMessage = `${assistantMessage} ${relevanceHint}`.trim()
  }

  if (isRelevant) {
    if (!assistantMessage.toLowerCase().includes("generel")) {
      assistantMessage = `${assistantMessage} Du kan læse mere i den generelle information om hypnoterapi.`.trim()
    }
  }

  return {
    ...output,
    render: {
      ...output.render,
      assistant_message: assistantMessage,
    },
  }
}

function parseOutput(data: Record<string, unknown> | null): TriageOutput | null {
  if (!data) return null
  const decisionRaw = data.decision as Record<string, unknown> | undefined
  const renderRaw = data.render as Record<string, unknown> | undefined
  if (!decisionRaw || !renderRaw) return null

  return {
    decision: {
      relevance: normalizeRelevance(decisionRaw.relevance),
      topic_tags: toStringArray(decisionRaw.topic_tags),
      user_goal: typeof decisionRaw.user_goal === "string" ? decisionRaw.user_goal : "",
      key_triggers: toStringArray(decisionRaw.key_triggers),
      time_horizon:
        typeof decisionRaw.time_horizon === "string" ? decisionRaw.time_horizon : "",
      confidence: normalizeConfidence(decisionRaw.confidence),
      next_state: normalizeNextState(decisionRaw.next_state),
      notes_for_context:
        typeof decisionRaw.notes_for_context === "string"
          ? decisionRaw.notes_for_context
          : "",
    },
    render: {
      assistant_message:
        typeof renderRaw.assistant_message === "string"
          ? renderRaw.assistant_message
          : "",
      next_question:
        typeof renderRaw.next_question === "string" ? renderRaw.next_question : "",
      chips: Array.isArray(renderRaw.chips)
        ? renderRaw.chips
            .map((chip) => {
              if (!chip || typeof chip !== "object") return null
              const c = chip as Record<string, unknown>
              if (typeof c.id !== "string" || typeof c.label !== "string") {
                return null
              }
              return { id: c.id, label: c.label }
            })
            .filter(Boolean) as Array<{ id: string; label: string }>
        : [],
    },
  }
}

function heuristic(context: AiCapabilityContext): TriageOutput {
  const text = context.userText.toLowerCase()
  const likelyYes = ["stress", "angst", "søvn", "vane", "fobi", "uro"].some((w) =>
    text.includes(w)
  )
  const likelyNo = ["juridisk", "skadeanmeldelse", "it-problem", "økonomi"].some((w) =>
    text.includes(w)
  )

  if (likelyNo) {
    return {
      decision: {
        relevance: "NO",
        topic_tags: ["outside_scope"],
        user_goal: "",
        key_triggers: [],
        time_horizon: "",
        confidence: 0.8,
        next_state: "CLOSE",
        notes_for_context: "Emnet virker uden for hypnoterapi",
      },
      render: {
        assistant_message:
          "Tak fordi du deler det. Det, du beskriver, ligger sandsynligvis uden for hypnoterapiens område.",
        next_question: "",
        chips: DEFAULT_CHIPS,
      },
    }
  }

  if (likelyYes) {
    return {
      decision: {
        relevance: "YES",
        topic_tags: ["common_hypnosis_topic"],
        user_goal: "Forandring i oplevet udfordring",
        key_triggers: [],
        time_horizon: "",
        confidence: 0.75,
        next_state: "CONFIRM",
        notes_for_context: "Tydelig relevans for hypnoterapi",
      },
      render: {
        assistant_message:
          "Tak fordi du deler det. Det, du beskriver, er relevant for hypnoterapi.",
        next_question: "Giver det mening, at vi kort opsummerer dit mål som næste skridt?",
        chips: [...DEFAULT_CHIPS, { id: "book", label: "Book tid" }],
      },
    }
  }

  return {
    decision: {
      relevance: "UNCLEAR",
      topic_tags: [],
      user_goal: "",
      key_triggers: [],
      time_horizon: "",
      confidence: 0.5,
      next_state: "EXPLORE",
      notes_for_context: "Kræver mere afklaring",
    },
    render: {
      assistant_message: "Tak fordi du deler det. Jeg vil gerne forstå din situation lidt bedre.",
      next_question: "Hvad ønsker du konkret skal være anderledes om 1-2 måneder?",
      chips: DEFAULT_CHIPS,
    },
  }
}

function buildTransition(
  context: AiCapabilityContext,
  output: TriageOutput,
  previousTranscript: TranscriptTurn[]
): Transition {
  const previousCount = countFromMeta(context)
  const nextCount = Math.min(previousCount + 1, 6)

  const chips = output.render.chips.length > 0 ? output.render.chips : DEFAULT_CHIPS
  const hasBook = chips.some((c) => c.id === "book")
  const shouldHaveBook =
    output.decision.relevance === "YES" || output.decision.relevance === "LIKELY"

  const finalChips = shouldHaveBook && !hasBook
    ? [...chips, { id: "book", label: "Book tid" }]
    : chips

  const assistantText = buildAssistantText(output.render)
  const transcript = appendTranscript(previousTranscript, context.userText, assistantText)

  let to: Transition["to"] = "TRIAGE"
  if (output.decision.relevance === "NO") {
    to = "TRIAGE_NOT_RELEVANT"
  } else if (
    output.decision.next_state === "CONFIRM" &&
    (output.decision.relevance === "YES" || output.decision.relevance === "LIKELY")
  ) {
    to = "TRIAGE_FIT_BOOKING"
  } else if (output.decision.next_state === "CLOSE") {
    to =
      output.decision.relevance === "YES" || output.decision.relevance === "LIKELY"
        ? "TRIAGE_FIT_BOOKING"
        : "TRIAGE_NEEDS_ASSESSMENT"
  }

  return {
    type: "NODE_HOP",
    from: context.state.active_node,
    to,
    reason: "triage capability decision",
    response_message: assistantText,
    meta_delta: {
      "triage.question_count": nextCount,
      "triage.outcome": output.decision.relevance,
      "triage.summary": output.render.assistant_message,
      "triage.unclear_points": output.decision.notes_for_context,
      "triage.topic_tags": output.decision.topic_tags,
      "triage.user_goal": output.decision.user_goal,
      "triage.key_triggers": output.decision.key_triggers,
      "triage.time_horizon": output.decision.time_horizon,
      "triage.confidence": output.decision.confidence,
      "triage.next_state": output.decision.next_state,
      "triage.notes_for_context": output.decision.notes_for_context,
      "triage.next_question": output.render.next_question,
      "triage.chips": finalChips,
      "triage.transcript": transcript,
    },
  }
}

async function runTriageCapability(
  context: AiCapabilityContext,
  llm: LlmClient
): Promise<AiCapabilityResult> {
  const model = process.env.TRIAGE_LLM_MODEL ?? "gpt-4o-mini"
  const transcript = readTranscript(context)

  const payload = {
    model,
    temperature: 0,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system" as const, content: TRIAGE_PROMPT },
      {
        role: "user" as const,
        content: JSON.stringify({
          current_node: context.state.active_node,
          latest_user_message: context.userText,
          triage_question_count:
            typeof context.state.meta["triage.question_count"]?.value === "number"
              ? context.state.meta["triage.question_count"]?.value
              : 0,
          prior_notes:
            typeof context.state.meta["triage.notes_for_context"]?.value === "string"
              ? context.state.meta["triage.notes_for_context"]?.value
              : "",
          prior_relevance:
            typeof context.state.meta["triage.outcome"]?.value === "string"
              ? context.state.meta["triage.outcome"]?.value
              : "",
          prior_user_goal:
            typeof context.state.meta["triage.user_goal"]?.value === "string"
              ? context.state.meta["triage.user_goal"]?.value
              : "",
          conversation_transcript: transcript,
        }),
      },
    ],
  }

  const raw = await llm.chatJson(payload)
  const parsed = parseOutput(raw)
  const usedFallback = !parsed
  const output = enforceMessagePolicy(parsed ?? heuristic(context))

  return {
    transition: buildTransition(context, output, transcript),
    debug: {
      capability: "triage-relevance-v1",
      used_fallback: usedFallback,
    },
  }
}

export const triageCapability: AiCapability = {
  id: "triage-relevance-v1",
  run: runTriageCapability,
}
