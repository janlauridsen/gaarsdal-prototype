import type { ConversationState } from "../kernel/types"
import type { UpsertFieldInput } from "./store"

function getMetaValue(state: ConversationState, key: string): unknown {
  const v = (state as any)?.meta?.[key]?.value
  return v
}

function coerceString(x: unknown): string | null {
  if (typeof x === "string" && x.trim()) return x
  return null
}

function coerceStringArray(x: unknown): string[] | null {
  if (!Array.isArray(x)) return null
  const out = x
    .filter((t) => typeof t === "string" && t.trim())
    .map((t) => (t as string).trim())
  return out.length ? out : null
}

function mapTimeHorizon(x: unknown): "acute" | "recent" | "chronic" | null {
  const s = coerceString(x)?.toLowerCase()
  if (!s) return null

  // Accept existing values as-is if already normalized.
  if (s === "acute" || s === "recent" || s === "chronic") return s

  // Minimal mapping from common Danish/English variants.
  if (s.includes("akut")) return "acute"
  if (s.includes("nylig") || s.includes("recent")) return "recent"
  if (s.includes("kron") || s.includes("chronic") || s.includes("lang")) return "chronic"

  return null
}

export function buildTriageContextUpdates(params: {
  state: ConversationState
  userKey: string
  turnId: string
}): UpsertFieldInput[] {
  const { state } = params

  const triageConfidenceRaw = getMetaValue(state, "triage.confidence")
  const triageConfidence = typeof triageConfidenceRaw === "number" ? triageConfidenceRaw : null

  const updates: UpsertFieldInput[] = []
  const baseConfidence = typeof triageConfidence === "number" ? triageConfidence : 0.65

  const summary = coerceString(getMetaValue(state, "triage.notes_for_context"))
  if (summary) {
    updates.push({
      path: "presentingIssue.summary",
      value: summary,
      evidence: { source: "MODEL_INFERRED", turn_id: params.turnId, method: "TRIAGE" },
      confidence: baseConfidence,
    })
  }

  const domains = coerceStringArray(getMetaValue(state, "triage.topic_tags"))
  if (domains) {
    updates.push({
      path: "presentingIssue.domains",
      value: domains,
      evidence: { source: "MODEL_INFERRED", turn_id: params.turnId, method: "TRIAGE" },
      confidence: baseConfidence,
    })
  }

  const horizon = mapTimeHorizon(getMetaValue(state, "triage.time_horizon"))
  if (horizon) {
    updates.push({
      path: "presentingIssue.timeHorizon",
      value: horizon,
      evidence: { source: "MODEL_INFERRED", turn_id: params.turnId, method: "TRIAGE" },
      confidence: baseConfidence,
    })
  }

  const goal = coerceString(getMetaValue(state, "triage.user_goal"))
  if (goal) {
    updates.push({
      path: "goals.primary",
      value: goal,
      evidence: { source: "MODEL_INFERRED", turn_id: params.turnId, method: "TRIAGE" },
      confidence: baseConfidence,
    })
  }

  if (typeof triageConfidence === "number") {
    updates.push({
      path: "metadata.triageConfidence",
      value: triageConfidence,
      evidence: { source: "SYSTEM_DERIVED", turn_id: params.turnId, method: "TRIAGE" },
      confidence: 0.98,
    })
  }

  // NOTE: We do not project triage.key_triggers into substanceRisk/ABC automatically.
  // That step should be USER_STATED in later turns.

  return updates
}
