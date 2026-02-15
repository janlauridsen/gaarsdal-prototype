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

function incrementQuestionCount(context: AiCapabilityContext): number {
  const current = countFromMeta(context)
  const next = current + 1
  writeMeta(context, "triage.question_count", next)
  return next
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

function writeMetaTranscript(context: AiCapabilityContext, transcript: TranscriptTurn[]): void {
  writeMeta(context, "triage.transcript", transcript)
}

function deriveOutcome(output: TriageOutput, questionCount: number): Transition {
  const nextNode = output.decision.relevance === "YES" || output.decision.relevance === "LIKELY" ? "GEN_HYPNO" : "TRIAGE"
  return {
    type: "NODE_HOP",
    from: "TRIAGE",
    to: nextNode,
    reason: `triage: ${output.decision.relevance} (${questionCount})`,
    meta_delta: {
      "triage.decision": output.decision,
      "triage.render": output.render,
    },
  }
}

export const triageCapability: AiCapability = {
  id: "triage-relevance-v1",
  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const questionCount = incrementQuestionCount(context)

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
            user_input: context.userText,
          }),
        },
      ],
    } satisfies LlmChatInput

    const response = await llm.chatJson(payload)
    const output = response ? normalizeOutput(response, context) : buildFallbackOutput(context)

    const transition = deriveOutcome(output, questionCount)
    const assistantText = buildAssistantText(output.render)
    const updatedTranscript = appendTranscript(transcript, context.userText, assistantText)

    writeMetaDecision(context, output, questionCount)
    writeMetaTranscript(context, updatedTranscript)

    return {
      transition: {
        ...transition,
        response_message: assistantText,
      },
      debug: {
        capability: "triage-relevance-v1",
        used_fallback: !response,
      },
    }
  },
}
