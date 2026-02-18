export type EvidenceSource =
  | "USER_STATED"
  | "MODEL_INFERRED"
  | "ASSESSMENT_SCORE"
  | "SYSTEM_DERIVED"

export type Evidence = {
  source: EvidenceSource
  turn_id?: string
  method?: string
}

export type Freshness = {
  first_observed_at: string
  last_confirmed_at?: string
  valid_until?: string
}

export type FieldStatus = "ACTIVE" | "SUPERSEDED" | "RETRACTED"

export type EvidenceTagged<T> = {
  id: string
  path: string
  value: T
  evidence: Evidence
  confidence: number // 0..1
  freshness: Freshness
  status: FieldStatus
  superseded_by?: string | null
}

export type TherapeuticContextEnvelope = {
  schemaVersion: string // e.g. therapeutic-context@1.0.0
  conversationId: string
  userKey: string
  updatedAt: string
  fields: Record<string, EvidenceTagged<unknown>>
}
