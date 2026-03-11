import { Transition } from "../../kernel/types"
import {
  AiCapability,
  AiCapabilityContext,
  AiCapabilityResult,
  LlmClient,
} from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const MAX_TRANSCRIPT_TURNS = 40
const MAX_TRANSCRIPT_CHARS = 8000

const REFLECTION_PROMPT = `
ROLE
You are a calm and thoughtful conversational partner who helps people reflect
on patterns in their relationship with alcohol or other habits.

Your role is reflection only.
You do not diagnose addiction, provide treatment, or judge behaviour.

GOAL
Help the user notice:
- patterns
- emotions
- triggers
- inner conflicts

Do not run therapy. Do not prescribe change.

INPUT
You receive:
- conversation_transcript
- user_input
- topic

RESPONSE STYLE
Responses should usually contain:

1. Short reflection (1-3 sentences)
2. Optional observation about patterns
3. Optional reflective question

Rules:
- maximum one question
- calm tone
- no diagnosis
- no treatment advice
- avoid sounding scripted

OUTPUT
Return JSON only:

{
  "assistant_message": string
}
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["focused_reflection.transcript"]?.value

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
  const capped = turns.slice(-MAX_TRANSCRIPT_TURNS)

  const result: TranscriptTurn[] = []
  let chars = 0

  for (let i = capped.length - 1; i >= 0; i--) {
    const len = capped[i].content.length
    if (chars + len > MAX_TRANSCRIPT_CHARS) break

    result.unshift(capped[i])
    chars += len
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

function readTopic(context: AiCapabilityContext): string {
  const raw = context.state.meta["focused_reflection.topic"]?.value
  return typeof raw === "string" && raw.trim() ? raw.trim() : "det"
}

function fallback(topic: string): string {
  return (
    "Tak fordi du deler det. Hvis du vil, kan vi se lidt nærmere på dit forhold til " +
    topic +
    ". Hvad får dig især til at tænke over det lige nu?"
  )
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function stripPunctuation(text: string): string {
  return normalizeText(text).replace(/[.,!?;:()"'’“”\-–—]/g, " ")
}

function isExitFocusedReflection(text: string): boolean {
  const t = stripPunctuation(text)

  const exact = new Set([
    "stop",
    "afslut",
    "slut",
    "ud",
    "tilbage",
    "hjem",
    "home",
    "menu",
    "hovedmenu",
    "ikke nu",
    "senere",
    "pause",
    "jeg vil ikke tale mere om det nu",
    "jeg vil ikke tale om det nu",
    "jeg vil ikke mere nu",
    "jeg vil ud af samtalen",
    "jeg vil ud af denne samtale",
    "kan vi hoppe ud af denne samtale nu",
    "kan vi hoppe ud nu",
    "kan vi stoppe nu",
    "kan vi afslutte nu",
    "lad os tale om noget andet",
    "jeg vil tale om noget andet",
    "skift emne",
  ])

  if (exact.has(t)) return true

  if (
    (t.includes("hoppe ud") && t.includes("samtale")) ||
    (t.includes("ud af") && t.includes("samtale")) ||
    (t.includes("ikke tale") && t.includes("nu")) ||
    (t.includes("tale om noget andet")) ||
    (t.includes("skift") && t.includes("emne")) ||
    (t.includes("til") && t.includes("hovedmenu")) ||
    (t.includes("gå") && t.includes("hjem"))
  ) {
    return true
  }

  return false
}

function buildExitMessage(): string {
  return (
    "Det er helt fint. Vi forlader den fokuserede samtale her. " +
    "Du er tilbage i hovedsporet og kan vælge et andet emne, eller stoppe her."
  )
}

export const focusedPatternReflectionCapability: AiCapability = {
  id: "focused-pattern-reflection-v1",

  async run(
    context: AiCapabilityContext,
    llm: LlmClient
  ): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const trimmedTranscript = trimTranscript(transcript)
    const topic = readTopic(context)
    const userText = context.userText ?? ""

    if (isExitFocusedReflection(userText)) {
      const assistant = buildExitMessage()
      const updatedTranscript = appendTranscript(transcript, userText, assistant)

      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "HOME",
        reason: "focused-pattern-reflection-exit",
        response_message: assistant,
        meta_delta: {
          "focused_reflection.transcript": updatedTranscript,
          "focused_reflection.stage": "EXITED",
        },
      }

      return {
        transition,
        debug: {
          capability: "focused-pattern-reflection-v1",
          used_fallback: false,
        },
      }
    }

    const payload = {
      model: process.env.REFLECTION_MODEL ?? "gpt-4.1-mini",
      temperature: 0.5,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: REFLECTION_PROMPT },
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: trimmedTranscript,
            user_input: userText,
            topic,
          }),
        },
      ],
    }

    let assistant = ""
    let usedFallback = false

    try {
      const result = await llm.chatJson(payload)

      if (
        result &&
        typeof result.assistant_message === "string" &&
        result.assistant_message.trim()
      ) {
        assistant = result.assistant_message.trim()
      }
    } catch {
      usedFallback = true
    }

    if (!assistant) {
      assistant = fallback(topic)
      usedFallback = true
    }

    const updatedTranscript = appendTranscript(
      transcript,
      userText,
      assistant
    )

    const meta_delta: Record<string, unknown> = {
      "focused_reflection.transcript": updatedTranscript,
      "focused_reflection.stage": "OPEN",
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: "FOCUSED_PATTERN_REFLECTION",
      reason: "focused-pattern-reflection",
      response_message: assistant,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "focused-pattern-reflection-v1",
        used_fallback: usedFallback,
      },
    }
  },
}
