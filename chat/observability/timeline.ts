import { LogEvent } from "../kernel/types"
import { TimelineEntry } from "./types"

export function timeline(logs: LogEvent[]): TimelineEntry[] {
  return logs.map((l) => ({
    revision: l.revision_after,
    transition: l.transition_type,
    from: l.active_node_before,
    to: l.active_node_after,
  }))
}
