import {
  ConversationState,
  LogEvent,
  TransitionType,
} from "../kernel/types"
import { ReplayResult } from "./types"

export function replay(
  initial: ConversationState,
  logs: LogEvent[]
): ReplayResult {
  const states: ConversationState[] = [initial]

  for (const log of logs) {
    const prev = states[states.length - 1]

    if (log.revision_before !== prev.revision) {
      throw new Error(
        `Revision mismatch at ${log.revision_before}`
      )
    }

    const next: ConversationState = {
      ...prev,
      revision: log.revision_after,
      active_node: log.active_node_after,
    }

    states.push(next)
  }

  return { states }
}
