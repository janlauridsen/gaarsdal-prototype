// chat/methodFit/merge.ts
// Version: 2026-02-23
// Purpose: Confidence-weighted merge for method-fit case schema.

import type { ConfidenceValue, MethodFitCaseSchemaV1, UnknownCandidate } from "./schema"
import type { HardConstraint, ProblemTag, SoftPreference } from "./taxonomy"

function isNullOrEmptyString(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim().length === 0)
}

function isEmptyArray(v: unknown): boolean {
  return Array.isArray(v) && v.length === 0
}

function hasNonEmptyValue(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim().length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === "object") return Object.keys(v as any).length > 0
  return true
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function shouldUpdateConfidence(oldC: number, nextC: number): boolean {
  return clamp01(nextC) >= clamp01(oldC) + 0.05
}

function dedupeStrings(items: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of items) {
    const k = String(x).trim()
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

function dedupeUnion<T>(a: T[], b: T[]): T[] {
  const out: T[] = []
  const seen = new Set<string>()
  const add = (x: T) => {
    const k = typeof x === "string" ? `s:${x}` : `j:${JSON.stringify(x)}`
    if (seen.has(k)) return
    seen.add(k)
    out.push(x)
  }
  for (const x of a) add(x)
  for (const x of b) add(x)
  return out
}

export function mergeConfidenceValue<T>(
  oldField: ConfidenceValue<T>,
  patchField: ConfidenceValue<T>
): ConfidenceValue<T> {
  const oldValue = oldField.value
  const nextValue = patchField.value

  if (hasNonEmptyValue(oldValue) && (isNullOrEmptyString(nextValue) || isEmptyArray(nextValue))) {
    return oldField
  }

  if (!shouldUpdateConfidence(oldField.confidence, patchField.confidence)) {
    return oldField
  }

  if (Array.isArray(oldValue) && Array.isArray(nextValue)) {
    return { value: dedupeUnion(oldValue, nextValue) as any, confidence: clamp01(patchField.confidence) }
  }

  return { value: nextValue, confidence: clamp01(patchField.confidence) }
}

export type MethodFitPatchV1 = {
  scope?: {
    presenting_problem?: ConfidenceValue<string | null>
    desired_outcome?: ConfidenceValue<string | null>
  }
  problem_tags?: ConfidenceValue<ProblemTag[]>
  constraints?: {
    hard?: ConfidenceValue<HardConstraint[]>
    soft?: ConfidenceValue<SoftPreference[]>
  }
  red_flags?: { active?: boolean; signals?: string[] }
  hypnosis_fit?: { level?: "primary" | "secondary" | "low_fit"; rationale?: string }
  unknown_candidates?: UnknownCandidate[]
}

export function mergeMethodFitCase(
  current: MethodFitCaseSchemaV1,
  patch: MethodFitPatchV1
): MethodFitCaseSchemaV1 {
  const next: MethodFitCaseSchemaV1 = JSON.parse(JSON.stringify(current))

  if (patch.scope?.presenting_problem)
    next.scope.presenting_problem = mergeConfidenceValue(
      next.scope.presenting_problem,
      patch.scope.presenting_problem
    )
  if (patch.scope?.desired_outcome)
    next.scope.desired_outcome = mergeConfidenceValue(next.scope.desired_outcome, patch.scope.desired_outcome)

  if (patch.problem_tags) next.problem_tags = mergeConfidenceValue(next.problem_tags, patch.problem_tags)

  if (patch.constraints?.hard)
    next.constraints.hard = mergeConfidenceValue(next.constraints.hard, patch.constraints.hard)
  if (patch.constraints?.soft)
    next.constraints.soft = mergeConfidenceValue(next.constraints.soft, patch.constraints.soft)

  if (patch.red_flags) {
    if (typeof patch.red_flags.active === "boolean") next.red_flags.active = patch.red_flags.active
    if (Array.isArray(patch.red_flags.signals)) {
      next.red_flags.signals = dedupeStrings([...next.red_flags.signals, ...patch.red_flags.signals])
    }
  }

  if (patch.hypnosis_fit) {
    if (patch.hypnosis_fit.level) next.hypnosis_fit.level = patch.hypnosis_fit.level
    if (patch.hypnosis_fit.rationale !== undefined) {
      if (!(hasNonEmptyValue(next.hypnosis_fit.rationale) && isNullOrEmptyString(patch.hypnosis_fit.rationale))) {
        next.hypnosis_fit.rationale = String(patch.hypnosis_fit.rationale ?? "")
      }
    }
  }

  if (Array.isArray(patch.unknown_candidates) && patch.unknown_candidates.length) {
    const existing = next.unknown_candidates
    const map = new Map(existing.map((c) => [c.normalized_key, c]))
    for (const cand of patch.unknown_candidates) {
      if (!cand || typeof cand !== "object") continue
      if (!cand.normalized_key) continue
      const prev = map.get(cand.normalized_key)
      if (!prev) {
        map.set(cand.normalized_key, cand)
      } else {
        // Keep earliest first_seen_at
        const merged: UnknownCandidate = {
          ...prev,
          raw_name: prev.raw_name || cand.raw_name,
          dk_presence_status: prev.dk_presence_status || cand.dk_presence_status,
          first_seen_at: prev.first_seen_at || cand.first_seen_at,
          normalized_key: prev.normalized_key,
        }
        map.set(cand.normalized_key, merged)
      }
    }
    next.unknown_candidates = Array.from(map.values())
  }

  return next
}
