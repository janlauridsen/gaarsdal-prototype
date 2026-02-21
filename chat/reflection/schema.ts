export type LanguageCode = "da"

export type ConfidenceValue<T> = {
  value: T
  confidence: number // 0..1
}

export type TargetBehaviorCategory =
  | "substance"
  | "anxiety"
  | "habit"
  | "eating"
  | "gambling"
  | "relational"
  | "mood"
  | "existential"
  | "unknown"

export type ReflectionCaseSchemaV1 = {
  case: {
    case_id: string
    created_at: string
    language: LanguageCode
  }

  target_behavior: {
    category: TargetBehaviorCategory
    behavior_name: string | null
    frequency: string | null
    pattern: string | null
    loss_of_control: string | null
  }

  scope: {
    presenting_problem: ConfidenceValue<string | null>
    desired_outcome: ConfidenceValue<string | null>
    success_markers: ConfidenceValue<string[]>
    constraints: ConfidenceValue<string[]>
  }

  cognitive_diamond: {
    context_trigger: ConfidenceValue<string | null>
    thoughts: ConfidenceValue<string[]>
    emotions: ConfidenceValue<string[]>
    body: ConfidenceValue<string[]>
    behavior: ConfidenceValue<string[]>
    consequences: ConfidenceValue<string[]>
  }

  regulation_model: {
    trigger_type: string | null
    primary_affect: string | null
    coping_behavior: string | null
    short_term_effect: string | null
    long_term_cost: string | null
    regulation_confidence: number // 0..1
  }

  metacognition: {
    intrusions: string[]
    response_style: string | null
    meta_beliefs_positive: string[]
    meta_beliefs_negative: string[]
    belief_flexibility_score: number // 0..1
  }

  resources: {
    strengths: string[]
    exceptions: string[]
    support: string[]
  }

  risk_engine: {
    functional_impairment: number // 0..1
    dependency_risk: number // 0..1
    escalation_velocity: number // 0..1
    family_impact: number // 0..1
    safety_flag: boolean
    override_active: boolean
  }

  maturity_model: {
    dimensions: {
      scope_clarity: number // 0..1
      episode_specificity: number // 0..1
      functional_understanding: number // 0..1
      maintenance_loop_clarity: number // 0..1
      resource_activation: number // 0..1
      cognitive_clarity: number // 0..1
      meta_process_clarity: number // 0..1
    }
  }

  change_dynamics: {
    motivation_level: number // 0..1
    ambivalence_level: number // 0..1
    self_efficacy: number // 0..1
    intervention_readiness: number // 0..1
  }

  dialog_dynamics: {
    novelty_score: number // 0..1
    repetition_score: number // 0..1
    fatigue_signal: number // 0..1
    progress_score: number // 0..1
    stall_counter: number
    stall_detected: boolean
  }

  handoff_readiness: {
    user_satisfaction_signal: number // 0..1
    goal_clarity: number // 0..1
    risk_clearance: number // 0..1
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createEmptyReflectionCase(conversationId: string): ReflectionCaseSchemaV1 {
  return {
    case: {
      case_id: conversationId,
      created_at: nowIso(),
      language: "da",
    },

    target_behavior: {
      category: "unknown",
      behavior_name: null,
      frequency: null,
      pattern: null,
      loss_of_control: null,
    },

    scope: {
      presenting_problem: { value: null, confidence: 0.0 },
      desired_outcome: { value: null, confidence: 0.0 },
      success_markers: { value: [], confidence: 0.0 },
      constraints: { value: [], confidence: 0.0 },
    },

    cognitive_diamond: {
      context_trigger: { value: null, confidence: 0.0 },
      thoughts: { value: [], confidence: 0.0 },
      emotions: { value: [], confidence: 0.0 },
      body: { value: [], confidence: 0.0 },
      behavior: { value: [], confidence: 0.0 },
      consequences: { value: [], confidence: 0.0 },
    },

    regulation_model: {
      trigger_type: null,
      primary_affect: null,
      coping_behavior: null,
      short_term_effect: null,
      long_term_cost: null,
      regulation_confidence: 0.0,
    },

    metacognition: {
      intrusions: [],
      response_style: null,
      meta_beliefs_positive: [],
      meta_beliefs_negative: [],
      belief_flexibility_score: 0.0,
    },

    resources: {
      strengths: [],
      exceptions: [],
      support: [],
    },

    risk_engine: {
      functional_impairment: 0.0,
      dependency_risk: 0.0,
      escalation_velocity: 0.0,
      family_impact: 0.0,
      safety_flag: false,
      override_active: false,
    },

    maturity_model: {
      dimensions: {
        scope_clarity: 0.0,
        episode_specificity: 0.0,
        functional_understanding: 0.0,
        maintenance_loop_clarity: 0.0,
        resource_activation: 0.0,
        cognitive_clarity: 0.0,
        meta_process_clarity: 0.0,
      },
    },

    change_dynamics: {
      motivation_level: 0.0,
      ambivalence_level: 0.0,
      self_efficacy: 0.0,
      intervention_readiness: 0.0,
    },

    dialog_dynamics: {
      novelty_score: 0.0,
      repetition_score: 0.0,
      fatigue_signal: 0.0,
      progress_score: 0.0,
      stall_counter: 0,
      stall_detected: false,
    },

    handoff_readiness: {
      user_satisfaction_signal: 0.0,
      goal_clarity: 0.0,
      risk_clearance: 0.0,
    },
  }
}
