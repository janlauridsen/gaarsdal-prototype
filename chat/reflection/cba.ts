import { createOpenAiCompatibleClient } from "../ai/provider"
import { readReflectionCase, writeReflectionCase } from "../persistence/reflectionCaseStore"
import { mergeReflectionCase } from "./merge"

const REFLECTION_TTL_SECONDS = 90 * 24 * 60 * 60

export const CBA_PROMPT_V1 =
  "Role: Case Builder Agent.\n\n" +
  "Input:\n- current_schema\n- user_message\n- therapist_message\n\n" +
  "Rules:\n" +
  "- Extract only explicit or strongly implied data.\n" +
  "- Update confidence conservatively.\n" +
  "- Compute maturity_model using rule-based coverage.\n" +
  "- Compute risk_engine using explicit behavioral signals.\n" +
  "- Compute dialog_dynamics baseline (novelty).\n" +
  "- Estimate repetition_score and fatigue_signal (±0.15 cap).\n" +
  "- Merge to progress_score.\n" +
  "- Detect stall if progress_score < 0.25 for 3 turns.\n" +
  "- Never propose exercises or interventions.\n" +
  "- If override_active = true, signal stabilization.\n\n" +
  "Output strictly JSON with:\n" +
  "- schema updates\n" +
  "- updated risk_engine\n" +
  "- maturity_model\n" +
  "- dialog_dynamics\n" +
  "- suggestions_for_therapist\n"

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x)
}

function pickSchemaPatch(out: Record<string, unknown>): Record<string, unknown> {
  // Spec does not define canonical key names.
  // Accept a few envelopes to avoid brittle coupling.
  const candidates = ["schema_updates", "schema", "patch", "updates"]
  for (const k of candidates) {
    const v = out[k]
    if (isRecord(v)) return v
  }
  return out
}

function pickSuggestions(out: Record<string, unknown>): string {
  const v = out["suggestions_for_therapist"]
  return typeof v === "string" ? v : ""
}

/**
 * Runs a single CBA update (LLM -> patch -> merge -> persist).
 * Can be used in-band (sync) or by the async worker.
 */
export async function runReflectionCbaUpdate(params: {
  conversationId: string
  userMessage: string
  therapistMessage: string
  ttlSeconds?: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const user_message = String(params.userMessage ?? "")
  const therapist_message = String(params.therapistMessage ?? "")

  // No-op if we do not have any meaningful text.
  if (!user_message.trim() && !therapist_message.trim()) return { ok: true }

  const current = await readReflectionCase(params.conversationId)

  const llm = createOpenAiCompatibleClient()
  const model = process.env.OPENAI_MODEL_JSON ?? "gpt-4o-mini"

  const out = await llm.chatJson({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CBA_PROMPT_V1 },
      {
        role: "user",
        content: JSON.stringify({
          current_schema: current,
          user_message,
          therapist_message,
        }),
      },
    ],
  })

  if (!out) return { ok: true }
  if (!isRecord(out)) return { ok: false, error: "CBA output was not a JSON object" }

  const patch = pickSchemaPatch(out)
  const suggestions = pickSuggestions(out)

  const merged = mergeReflectionCase(current, patch as any)
  if (suggestions.trim()) (merged as any).suggestions_for_therapist = suggestions.trim()

  await writeReflectionCase(params.conversationId, merged as any, params.ttlSeconds ?? REFLECTION_TTL_SECONDS)
  return { ok: true }
}
