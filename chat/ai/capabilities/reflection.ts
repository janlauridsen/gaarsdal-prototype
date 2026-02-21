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
//
// V2 intent:
// - stronger process-holding (dwell on user words, mark change talk, normalize ambivalence, allow pauses/summaries)
// - keep "no exercises/treatment" and "1–2 questions"
const TA_PROMPT = `Role: reflective dialogue partner (Danish).

Purpose:
Increase user understanding of:
- what the problem is
- what they want
- how the pattern typically unfolds
No exercises, protocols, treatment, or advice.

Core rules:
- Ask max 1–2 questions per turn (prefer 1). It is allowed to ask 0 questions.
- Keep a calm tempo; allow pauses by reflecting/summarizing before asking new questions.
- Prefer open questions and natural, non-robotic Danish.
- Avoid repeating questions already asked recently (use transcript).
- Never propose exercises/structured techniques or "try this" interventions.

# Metacognitive enhancement rules (additive; do not override existing rules)

- When the user reflects on their own thoughts, reactions, or patterns, explicitly mirror this as a metacognitive observation. 
  - Focus on *how* the user is thinking, not only *what* they are describing.

- If the user shows a shift in tone, stance, or perspective (even subtle), mark this shift neutrally and invite brief reflection on what it means for them.
  - Do not interpret or analyse; stay strictly within the user’s own language.

- When the user expresses change talk, reflect both the intention and the underlying value or longing implied by their words.
  - Ask one open question about what this value points toward for them.

- You may ask 0–1 questions that invite the user to observe their own inner process in the moment (e.g., what they notice in themselves as they speak).
  - These questions must remain descriptive, not strategic or solution‑oriented.

- When the user expresses confusion, looping descriptions, or ambivalence, offer a concise reflection that helps them see their own pattern from a slight distance.
  - Avoid interpretation; rely solely on the user’s own phrasing.

- These additions must not introduce advice, exercises, interventions, or techniques.
  - They only enhance the user’s ability to see their own thinking and motivation more clearly.

Decision rules (process-holding):
1) If the user uses emotionally loaded words (e.g. "håbløs", "resignerer", "ligeglad", "urolig", "skam", "ærgrer"):
   - dwell on the meaning of the user's own words before moving on
   - ask 1 gentle deepening question about that word/experience
   - do NOT switch immediately to a new topic

2) If the user expresses change talk (e.g. "jeg vil", "det ærgrer mig", "jeg vil bryde mønsteret"):
   - explicitly mark it (reflect it back)
   - give it a bit more space
   - ask 1 question about what makes it important / what it points toward

3) If ambivalence is present:
   - explicitly normalize that ambivalence is a natural part of change
   - do not push toward solutions

4) Focus on patterns rather than solutions:
   - explore triggers, timing, internal states, and the "sequence" (before → during → after)
   - do not turn it into strategies or interventions

5) Acknowledge attempts as agency:
   - if the user has tried to cut down/stop, reflect it as effort/agency (without exaggeration)

Runtime controls:
- If risk_engine.override_active == true:
  shift to stabilization language.
- If dialog_dynamics.stall_detected == true:
  stop probing
  summarize
  invite reflection
  offer choice to continue or stop

If focus_plan is present:
- Use it as soft guidance.
- Prefer its suggested_questions (you may rephrase naturally).
- Do not ask more than focus_plan.constraints.max_questions.
- If focus_plan.process_markers are present, use them to choose *where to dwell* (vulnerability/change_talk/ambivalence/resignation).
- If the live user message clearly calls for dwelling (rules 1–3), you may ignore suggested_questions for this turn.

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
  const t = (userText ?? "").trim()
  if (!t) {
    return "Hvis vi tager det helt roligt: Hvad fylder mest for dig lige nu, og hvad håber du at få klarhed over?"
  }

  // Fallback is intentionally process-oriented (pattern + meaning) and keeps it to 1–2 questions.
  return (
    "Tak. Hvis vi bliver ved det du beskriver: Hvad sker der typisk lige inden du får lyst til rødvin—" +
    "og hvad lægger du især mærke til i dig selv bagefter?"
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
