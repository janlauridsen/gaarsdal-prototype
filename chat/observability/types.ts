import { ConversationState, LogEvent, TransitionType } from "../kernel/types"

export type ReplayResult = {
  states: ConversationState[]
}

export type DiffEntry = {
  revision: number
  field: string
  before: unknown
  after: unknown
}

export type DiffResult = DiffEntry[]

export type ValidationError = {
  revision: number
  message: string
}

export type ValidationResult = {
  ok: boolean
  errors: ValidationError[]
}

export type TimelineEntry = {
  revision: number
  transition: TransitionType
  from: string
  to: string
}
