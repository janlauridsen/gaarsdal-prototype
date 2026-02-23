// chat/methodFit/taxonomy.ts
// Version: 2026-02-23
// Purpose: Node-local taxonomy for method-fit (no cross-thread / global state).

export type MethodFormat =
  | "talk" // conversation-based support (therapy/coaching)
  | "touch" // manual bodywork / hands-on
  | "needles" // acupuncture/needling
  | "self_practice" // exercises at home (breath/yoga/mindfulness)
  | "ingestible" // ingesting herbs/supplements
  | "energy" // energy-work/healing

export type EvidenceTier = "good" | "moderate" | "mixed" | "limited" | "experiential"

export type RiskTier = "low" | "medium" | "high"

// Hard constraints: treated as real constraints (Option 1)
// - no_needles/no_touch/no_ingestibles: filter out methods
// - no_homework: penalty (not filter) in V1 scoring
export type HardConstraint = "no_needles" | "no_touch" | "no_ingestibles" | "no_homework"

// Soft preferences: do not filter; can only lightly adjust overall ranking (List B)
export type SoftPreference = "prefer_talk" | "prefer_bodywork" | "prefer_self_practice" | "prefer_low_effort"

export type ProblemTag =
  | "stress"
  | "sleep"
  | "anxiety"
  | "habit"
  | "pain_msk"
  | "digestive"
  | "energy_fatigue"
  | "grief_loss"
  | "trauma"
  | "other"

export function evidenceTierToScore(tier: EvidenceTier): number {
  switch (tier) {
    case "good":
      return 1.0
    case "moderate":
      return 0.75
    case "mixed":
      return 0.5
    case "limited":
      return 0.25
    case "experiential":
      return 0.1
  }
}

export function riskTierToPenalty(tier: RiskTier): number {
  switch (tier) {
    case "low":
      return 0.0
    case "medium":
      return 0.1
    case "high":
      return 0.2
  }
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

export function formatConflictsHardConstraints(
  formats: MethodFormat[],
  hardConstraints: HardConstraint[]
): { excluded: boolean; reasons: string[] } {
  const reasons: string[] = []
  const set = new Set(formats)
  const hc = new Set(hardConstraints)

  if (hc.has("no_needles") && set.has("needles")) reasons.push("hard_constraint:no_needles")
  if (hc.has("no_touch") && set.has("touch")) reasons.push("hard_constraint:no_touch")
  if (hc.has("no_ingestibles") && set.has("ingestible")) reasons.push("hard_constraint:no_ingestibles")

  return { excluded: reasons.length > 0, reasons }
}

export function softPreferenceBonus(formats: MethodFormat[], soft: SoftPreference[]): number {
  const set = new Set(formats)
  let bonus = 0
  const s = new Set(soft)

  if (s.has("prefer_talk") && set.has("talk")) bonus += 0.05
  if (s.has("prefer_bodywork") && set.has("touch")) bonus += 0.05
  if (s.has("prefer_self_practice") && set.has("self_practice")) bonus += 0.05
  // prefer_low_effort is handled as a mild penalty against self_practice in List B.

  // Cap at +0.10
  if (bonus > 0.1) bonus = 0.1
  return bonus
}

export function lowEffortPenalty(formats: MethodFormat[], soft: SoftPreference[]): number {
  const set = new Set(formats)
  const s = new Set(soft)
  if (!s.has("prefer_low_effort")) return 0
  if (!set.has("self_practice")) return 0
  // Keep this small; soft prefs must not dominate.
  return 0.03
}
