import { Transition } from "../../kernel/types"
import { readReflectionCase } from "../../persistence/reflectionCaseStore"
import { readReflectionFocusPlan } from "../../persistence/reflectionFocusPlanStore"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
}

const MAX_TRANSCRIPT_TURNS = 16

// NOTE: Our LLM client currently supports JSON outputs (chatJson). The TA spec says "Output: Only dialogue text".
// We therefore ask the model to return JSON with assistant_message, and we emit only the message text to the user.
const TA_PROMPT = `Role: reflective dialogue partner.

Purpose:
Increase user understanding.
No exercises, protocols, or treatment.

Rules:
- Ask max 1–3 questions per turn (prefer 1).
- Prioritize the largest information gap for the next step.
- When user uses emotionally loaded words (e.g. "resignation", "håbløshed", "ligeglad"), gently explore what they mean in their own experience.
- Mark and give space to change talk (e.g. “det ærgrer mig”, “jeg vil bryde mønsteret”, “jeg er urolig for fremtiden”) before moving on.
- Normalize ambivalence as natural in change work, especially when user describes relapse or giving up.
- Keep a calm tempo; use brief pauses/reflective statements before the next question when vulnerability shows.
- Focus on pattern understanding (when/where/what triggers) rather than solutions.
- Acknowledge attempts (e.g. “du har prøvet at skære ned flere gange”) to strengthen agency without praise or pressure.
- If focus_plan is present:
  - Use it as soft guidance.
  - Prefer its suggested_questions (you may rephrase naturally).
  - Do not ask more than focus_plan.constraints.max_questions.
- Avoid repeating questions already asked recently (use transcript).
- If risk_engine.override_active == true:
  shift to stabilization language.
- If dialog_dynamics.stall_detected == true:
  stop probing
  summarize
  invite reflection
  offer choice to continue or stop
- Never propose exercises/structured techniques.
- Natural, non-robotic Danish tone.

You receive:
- current_schema (JSON)
- focus_plan (JSON or null)
- conversation_transcript (list)
- user_input (string)

Return ONLY valid JSON:
{ "assistant_message": string }`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["reflection.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null
  const msg = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  if (!msg) return null
  return { assistant_message: msg }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad fylder mest for dig lige nu—og hvad håber du at få klarhed over?"
  }
  return (
    "Tak. Hvis vi gør det helt konkret: Hvad er det vigtigste du gerne vil forstå eller have ændret—" +
    "og hvornår lægger du især mærke til at det bliver svært?"
  )
}

export const reflectionCapability: AiCapability = {
  id: "reflection-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const schema = await readReflectionCase(context.state.conversation_id)
    const focus_plan = await readReflectionFocusPlan(context.state.conversation_id, context.state.revision)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const payload = {
      model: process.env.REFLECTION_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.5,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: TA_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            current_schema: schema,
            focus_plan,
            conversation_transcript: transcript,
            user_input: context.userText ?? "",
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)

    const assistant = parsed?.assistant_message ?? buildFallbackMessage(context.userText ?? "")
    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", assistant)

    // NOTE: Keep meta small. We only store a short transcript for context continuity.
    const meta_delta: Record<string, unknown> = {
      "reflection.transcript": updatedTranscript,
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "reflection-free-text",
      response_message: assistant,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "reflection-v1",
        used_fallback: !parsed,
      },
    }
  },
}
