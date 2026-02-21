import type { ReflectionCaseSchemaV1 } from "./schema"

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  const s = values.reduce((a, b) => a + b, 0)
  return s / values.length
}

export function recomputeReflectionRules(input: ReflectionCaseSchemaV1): ReflectionCaseSchemaV1 {
  // Copy shallowly; nested objects will be replaced where needed.
  const next: ReflectionCaseSchemaV1 = JSON.parse(JSON.stringify(input))

  // 3.2 Risk Override
  next.risk_engine.override_active = Boolean(next.risk_engine.safety_flag)

  // 3.1 Maturity Calculation (eksempel)
  // scope_clarity = mean(confidence of scope fields)
  next.maturity_model.dimensions.scope_clarity = clamp01(
    mean([
      next.scope.presenting_problem.confidence,
      next.scope.desired_outcome.confidence,
      next.scope.success_markers.confidence,
      next.scope.constraints.confidence,
    ])
  )

  // episode_specificity = mean(confidence of diamond fields)
  next.maturity_model.dimensions.episode_specificity = clamp01(
    mean([
      next.cognitive_diamond.context_trigger.confidence,
      next.cognitive_diamond.thoughts.confidence,
      next.cognitive_diamond.emotions.confidence,
      next.cognitive_diamond.body.confidence,
      next.cognitive_diamond.behavior.confidence,
      next.cognitive_diamond.consequences.confidence,
    ])
  )

  // functional_understanding = regulation_confidence
  next.maturity_model.dimensions.functional_understanding = clamp01(
    next.regulation_model.regulation_confidence
  )

  // resource_activation = mean(resource presence)
  // Spec says "mean(resource presence)"; we implement as mean of presence indicators.
  const strengthsPresent = next.resources.strengths.length > 0 ? 1 : 0
  const exceptionsPresent = next.resources.exceptions.length > 0 ? 1 : 0
  const supportPresent = next.resources.support.length > 0 ? 1 : 0
  next.maturity_model.dimensions.resource_activation = clamp01(
    mean([strengthsPresent, exceptionsPresent, supportPresent])
  )

  // 3.3 Intervention Readiness
  // intervention_readiness = mean(scope_clarity, maintenance_loop_clarity, self_efficacy) - ambivalence*0.5
  // maintenance_loop_clarity is NOT specified how computed in v1; we use its current value (no invention).
  next.change_dynamics.intervention_readiness = clamp01(
    mean([
      next.maturity_model.dimensions.scope_clarity,
      clamp01(next.maturity_model.dimensions.maintenance_loop_clarity),
      clamp01(next.change_dynamics.self_efficacy),
    ]) - clamp01(next.change_dynamics.ambivalence_level) * 0.5
  )

  // 3.4 Stall Detection (Hybrid)
  const progress_baseline = clamp01(next.dialog_dynamics.novelty_score)
  const repetition = clamp01(next.dialog_dynamics.repetition_score)
  const fatigue = clamp01(next.dialog_dynamics.fatigue_signal)

  const progress_score = clamp01(progress_baseline - repetition * 0.3 - fatigue * 0.3)
  next.dialog_dynamics.progress_score = progress_score

  if (progress_score < 0.25) {
    next.dialog_dynamics.stall_counter = Math.max(0, (next.dialog_dynamics.stall_counter ?? 0) + 1)
  } else {
    next.dialog_dynamics.stall_counter = 0
  }

  next.dialog_dynamics.stall_detected = next.dialog_dynamics.stall_counter >= 3

  return next
}
