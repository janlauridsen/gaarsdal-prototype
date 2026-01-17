import { LogEvent } from "../kernel/types"
import { ValidationResult, ValidationError } from "./types"

export function validateLogs(logs: LogEvent[]): ValidationResult {
  const errors: ValidationError[] = []

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]

    if (log.revision_after !== log.revision_before + 1) {
      errors.push({
        revision: log.revision_before,
        message: "Revision not monotonic",
      })
    }

    if (!log.transition_type) {
      errors.push({
        revision: log.revision_before,
        message: "Missing transition_type",
      })
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}
