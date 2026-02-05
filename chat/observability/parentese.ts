import { LogEvent } from "../kernel/types"
import { ValidationError } from "./types"

export function validateParenteseBalance(
  logs: LogEvent[]
): ValidationError[] {
  const errors: ValidationError[] = []
  let depth = 0

  for (const log of logs) {
    if (log.transition_type === "PARENTESE_OPEN") {
      depth++
    }

    if (log.transition_type === "PARENTESE_CLOSE") {
      depth--
      if (depth < 0) {
        errors.push({
          revision: log.revision_after,
          message: "Parentese underflow",
        })
        depth = 0
      }
    }
  }

  if (depth !== 0) {
    errors.push({
      revision: logs[logs.length - 1]?.revision_after ?? 0,
      message: "Unbalanced parentese stack",
    })
  }

  return errors
}
