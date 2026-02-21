import type { ConfidenceValue, ReflectionCaseSchemaV1 } from "./schema"
import { recomputeReflectionRules } from "./rules"

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
  // For objects, treat as non-empty if it has at least one own key.
  if (typeof v === "object") return Object.keys(v as any).length > 0
  return true
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
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

function shouldUpdateConfidence(oldC: number, nextC: number): boolean {
  return clamp01(nextC) >= clamp01(oldC) + 0.05
}

function mergeConfidenceValue<T>(
  oldField: ConfidenceValue<T>,
  patchField: ConfidenceValue<T>
): ConfidenceValue<T> {
  const oldValue = oldField.value
  const nextValue = patchField.value

  // Forbud mod at overskrive non-empty med null/empty
  if (hasNonEmptyValue(oldValue) && (isNullOrEmptyString(nextValue) || isEmptyArray(nextValue))) {
    return oldField
  }

  // Update kun hvis confidence_new >= confidence_old + 0.05
  if (!shouldUpdateConfidence(oldField.confidence, patchField.confidence)) {
    return oldField
  }

  // Arrays merge som union+dedupe når update tilladt
  if (Array.isArray(oldValue) && Array.isArray(nextValue)) {
    return {
      value: dedupeUnion(oldValue, nextValue) as any,
      confidence: clamp01(patchField.confidence),
    }
  }

  return {
    value: nextValue,
    confidence: clamp01(patchField.confidence),
  }
}

function clampHybridDelta(prev: number, next: number): number {
  const p = clamp01(prev)
  const n = clamp01(next)
  const lo = p - 0.15
  const hi = p + 0.15
  if (n < lo) return clamp01(lo)
  if (n > hi) return clamp01(hi)
  return n
}

export type ReflectionPatchV1 = Partial<ReflectionCaseSchemaV1> & {
  // Optional therapist suggestions channel from CBA output
  suggestions_for_therapist?: string
}

/**
 * Applies a CBA patch using confidence-weighted merge rules, then recomputes deterministic rule-engine fields.
 * - Does NOT invent values for unspecified fields.
 * - Preserves existing non-empty values against null/empty overwrites.
 * - Applies ±0.15 delta cap for repetition_score and fatigue_signal.
 */
export function mergeReflectionCase(
  current: ReflectionCaseSchemaV1,
  patch: Partial<ReflectionCaseSchemaV1>
): ReflectionCaseSchemaV1 {
  // Start from current
  const next: ReflectionCaseSchemaV1 = JSON.parse(JSON.stringify(current))

  // scope.*
  if (patch.scope?.presenting_problem)
    next.scope.presenting_problem = mergeConfidenceValue(
      next.scope.presenting_problem,
      patch.scope.presenting_problem
    )
  if (patch.scope?.desired_outcome)
    next.scope.desired_outcome = mergeConfidenceValue(
      next.scope.desired_outcome,
      patch.scope.desired_outcome
    )
  if (patch.scope?.success_markers)
    next.scope.success_markers = mergeConfidenceValue(
      next.scope.success_markers,
      patch.scope.success_markers
    )
  if (patch.scope?.constraints)
    next.scope.constraints = mergeConfidenceValue(next.scope.constraints, patch.scope.constraints)

  // cognitive_diamond.*
  if (patch.cognitive_diamond?.context_trigger)
    next.cognitive_diamond.context_trigger = mergeConfidenceValue(
      next.cognitive_diamond.context_trigger,
      patch.cognitive_diamond.context_trigger
    )
  if (patch.cognitive_diamond?.thoughts)
    next.cognitive_diamond.thoughts = mergeConfidenceValue(
      next.cognitive_diamond.thoughts,
      patch.cognitive_diamond.thoughts
    )
  if (patch.cognitive_diamond?.emotions)
    next.cognitive_diamond.emotions = mergeConfidenceValue(
      next.cognitive_diamond.emotions,
      patch.cognitive_diamond.emotions
    )
  if (patch.cognitive_diamond?.body)
    next.cognitive_diamond.body = mergeConfidenceValue(
      next.cognitive_diamond.body,
      patch.cognitive_diamond.body
    )
  if (patch.cognitive_diamond?.behavior)
    next.cognitive_diamond.behavior = mergeConfidenceValue(
      next.cognitive_diamond.behavior,
      patch.cognitive_diamond.behavior
    )
  if (patch.cognitive_diamond?.consequences)
    next.cognitive_diamond.consequences = mergeConfidenceValue(
      next.cognitive_diamond.consequences,
      patch.cognitive_diamond.consequences
    )

  // target_behavior (strings/nulls; no confidence fields in spec)
  if (patch.target_behavior) {
    const tb = patch.target_behavior
    if (tb.category) next.target_behavior.category = tb.category
    if (tb.behavior_name !== undefined) {
      if (!(hasNonEmptyValue(next.target_behavior.behavior_name) && isNullOrEmptyString(tb.behavior_name))) {
        next.target_behavior.behavior_name = tb.behavior_name
      }
    }
    if (tb.frequency !== undefined) {
      if (!(hasNonEmptyValue(next.target_behavior.frequency) && isNullOrEmptyString(tb.frequency))) {
        next.target_behavior.frequency = tb.frequency
      }
    }
    if (tb.pattern !== undefined) {
      if (!(hasNonEmptyValue(next.target_behavior.pattern) && isNullOrEmptyString(tb.pattern))) {
        next.target_behavior.pattern = tb.pattern
      }
    }
    if (tb.loss_of_control !== undefined) {
      if (
        !(
          hasNonEmptyValue(next.target_behavior.loss_of_control) &&
          isNullOrEmptyString(tb.loss_of_control)
        )
      ) {
        next.target_behavior.loss_of_control = tb.loss_of_control
      }
    }
  }

  // regulation_model
  if (patch.regulation_model) {
    const rm = patch.regulation_model
    const setNullable = (k: keyof typeof next.regulation_model, v: any) => {
      if (v === undefined) return
      const oldVal = next.regulation_model[k]
      if (hasNonEmptyValue(oldVal) && isNullOrEmptyString(v)) return
      ;(next.regulation_model as any)[k] = v
    }

    setNullable("trigger_type", rm.trigger_type)
    setNullable("primary_affect", rm.primary_affect)
    setNullable("coping_behavior", rm.coping_behavior)
    setNullable("short_term_effect", rm.short_term_effect)
    setNullable("long_term_cost", rm.long_term_cost)

    if (rm.regulation_confidence !== undefined) {
      next.regulation_model.regulation_confidence = clamp01(rm.regulation_confidence)
    }
  }

  // metacognition
  if (patch.metacognition) {
    const m = patch.metacognition
    if (m.intrusions) next.metacognition.intrusions = dedupeUnion(next.metacognition.intrusions, m.intrusions)
    if (m.meta_beliefs_positive)
      next.metacognition.meta_beliefs_positive = dedupeUnion(
        next.metacognition.meta_beliefs_positive,
        m.meta_beliefs_positive
      )
    if (m.meta_beliefs_negative)
      next.metacognition.meta_beliefs_negative = dedupeUnion(
        next.metacognition.meta_beliefs_negative,
        m.meta_beliefs_negative
      )

    if (m.response_style !== undefined) {
      if (!(hasNonEmptyValue(next.metacognition.response_style) && isNullOrEmptyString(m.response_style))) {
        next.metacognition.response_style = m.response_style
      }
    }

    if (m.belief_flexibility_score !== undefined) {
      next.metacognition.belief_flexibility_score = clamp01(m.belief_flexibility_score)
    }
  }

  // resources
  if (patch.resources) {
    const r = patch.resources
    if (r.strengths) next.resources.strengths = dedupeUnion(next.resources.strengths, r.strengths)
    if (r.exceptions) next.resources.exceptions = dedupeUnion(next.resources.exceptions, r.exceptions)
    if (r.support) next.resources.support = dedupeUnion(next.resources.support, r.support)
  }

  // risk_engine (rule-engine derives override_active deterministically)
  if (patch.risk_engine) {
    const re = patch.risk_engine
    if (re.functional_impairment !== undefined) next.risk_engine.functional_impairment = clamp01(re.functional_impairment)
    if (re.dependency_risk !== undefined) next.risk_engine.dependency_risk = clamp01(re.dependency_risk)
    if (re.escalation_velocity !== undefined) next.risk_engine.escalation_velocity = clamp01(re.escalation_velocity)
    if (re.family_impact !== undefined) next.risk_engine.family_impact = clamp01(re.family_impact)
    if (re.safety_flag !== undefined) next.risk_engine.safety_flag = Boolean(re.safety_flag)
    // ignore re.override_active here; recomputed deterministically
  }

  // maturity_model: keep unless explicitly set by patch (but deterministic fields will be recomputed)
  if (patch.maturity_model?.dimensions) {
    const d = patch.maturity_model.dimensions
    for (const k of Object.keys(d) as (keyof typeof next.maturity_model.dimensions)[]) {
      const v = d[k]
      if (v === undefined) continue
      ;(next.maturity_model.dimensions as any)[k] = clamp01(v as any)
    }
  }

  // change_dynamics: keep unless explicitly set by patch (intervention_readiness recomputed deterministically)
  if (patch.change_dynamics) {
    const cd = patch.change_dynamics
    if (cd.motivation_level !== undefined) next.change_dynamics.motivation_level = clamp01(cd.motivation_level)
    if (cd.ambivalence_level !== undefined) next.change_dynamics.ambivalence_level = clamp01(cd.ambivalence_level)
    if (cd.self_efficacy !== undefined) next.change_dynamics.self_efficacy = clamp01(cd.self_efficacy)
    // ignore cd.intervention_readiness here; recomputed deterministically
  }

  // dialog_dynamics: apply hybrid cap for repetition_score and fatigue_signal
  if (patch.dialog_dynamics) {
    const dd = patch.dialog_dynamics
    if (dd.novelty_score !== undefined) next.dialog_dynamics.novelty_score = clamp01(dd.novelty_score)

    if (dd.repetition_score !== undefined) {
      next.dialog_dynamics.repetition_score = clampHybridDelta(
        next.dialog_dynamics.repetition_score,
        dd.repetition_score
      )
    }

    if (dd.fatigue_signal !== undefined) {
      next.dialog_dynamics.fatigue_signal = clampHybridDelta(
        next.dialog_dynamics.fatigue_signal,
        dd.fatigue_signal
      )
    }

    // progress_score/stall_* are deterministic; ignore patch values
  }

  // handoff_readiness: keep unless explicitly set by patch (spec doesn't provide deterministic formula here)
  if (patch.handoff_readiness) {
    const hr = patch.handoff_readiness
    if (hr.user_satisfaction_signal !== undefined)
      next.handoff_readiness.user_satisfaction_signal = clamp01(hr.user_satisfaction_signal)
    if (hr.goal_clarity !== undefined) next.handoff_readiness.goal_clarity = clamp01(hr.goal_clarity)
    if (hr.risk_clearance !== undefined) next.handoff_readiness.risk_clearance = clamp01(hr.risk_clearance)
  }

  // Final: deterministic overwrite
  return recomputeReflectionRules(next)
}
