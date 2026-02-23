// chat/methodFit/schema.ts
// Version: 2026-02-23
// Purpose: Node-local method-fit case schema (stored per conversation in Redis).

import type { EvidenceTier, HardConstraint, MethodFormat, ProblemTag, RiskTier, SoftPreference } from "./taxonomy"
import type { MethodFitFocusPlanV1 } from "./focusPlan"

export type LanguageCode = "da"

export type ConfidenceValue<T> = {
  value: T
  confidence: number // 0..1
}

export type UnknownCandidate = {
  raw_name: string
  normalized_key: string
  dk_presence_status: "unverified" | "likely" | "unlikely" | "verified"
  first_seen_at: string
}

export type RankedMethod = {
  kind: "known"
  id: string
  label: string
  score: number // 0..1
  evidence_tier: EvidenceTier
  risk_tier: RiskTier
  formats: MethodFormat[]
  why: string[]
  cautions: string[]
  penalties_applied?: string[]
}

export type HypnosisRecommendation = {
  id: "hypnosis"
  label: "Hypnoterapi"
  fit: "primary" | "secondary" | "low_fit"
  why: string[]
  limits: string[]
  evidence_tier: EvidenceTier
  risk_tier: "low" | "medium"
}

export type UnknownOption = {
  kind: "unknown"
  raw_name: string
  normalized_key: string
  dk_presence_status: "unverified" | "likely" | "unlikely" | "verified"
  formats: MethodFormat[]
  why: string[]
  note: string
  validation?: { checked_at?: string; signals?: string[] }
}

export type MethodFitRecommendations = {
  problem_fit: RankedMethod[]
  overall: RankedMethod[]
  hypnosis: HypnosisRecommendation
  unknown_other_options: UnknownOption[]
  policy: {
    unknown_visibility: "immediate_flagged" | "delayed_until_likely"
    allow_unknown_in_top_lists: false
  }
}

export type MethodFitCaseSchemaV1 = {
  case: {
    case_id: string
    created_at: string
    language: LanguageCode
  }

  scope: {
    presenting_problem: ConfidenceValue<string | null>
    desired_outcome: ConfidenceValue<string | null>
  }

  problem_tags: ConfidenceValue<ProblemTag[]>

  constraints: {
    hard: ConfidenceValue<HardConstraint[]>
    soft: ConfidenceValue<SoftPreference[]>
  }

  red_flags: {
    active: boolean
    signals: string[]
  }

  hypnosis_fit: {
    level: "primary" | "secondary" | "low_fit"
    rationale: string
  }

  unknown_candidates: UnknownCandidate[]

  rankings: {
    problem_fit: RankedMethod[]
    overall: RankedMethod[]
  }

  focus_plan: MethodFitFocusPlanV1
}

function nowIso(): string {
  return new Date().toISOString()
}

export function createEmptyMethodFitCase(conversationId: string): MethodFitCaseSchemaV1 {
  return {
    case: {
      case_id: conversationId,
      created_at: nowIso(),
      language: "da",
    },
    scope: {
      presenting_problem: { value: null, confidence: 0.0 },
      desired_outcome: { value: null, confidence: 0.0 },
    },
    problem_tags: { value: [], confidence: 0.0 },
    constraints: {
      hard: { value: [], confidence: 0.0 },
      soft: { value: [], confidence: 0.0 },
    },
    red_flags: {
      active: false,
      signals: [],
    },
    hypnosis_fit: {
      level: "secondary",
      rationale: "",
    },
    unknown_candidates: [],
    rankings: {
      problem_fit: [],
      overall: [],
    },
    focus_plan: {
      version: "v1",
      conversation_id: conversationId,
      revision: 0,
      missing_fields: ["problem_tags"],
      suggested_questions: [],
      constraints: { max_questions: 1, avoid_repeat_within_turns: 8 },
      ready_for_recommendation: false,
      created_at: nowIso(),
    },
  }
}
