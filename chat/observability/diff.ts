import { ConversationState } from "../kernel/types"
import { DiffEntry, DiffResult } from "./types"

export function diffStates(
  a: ConversationState,
  b: ConversationState
): DiffResult {
  const diffs: DiffEntry[] = []

  const keys = new Set([
    ...Object.keys(a),
    ...Object.keys(b),
  ])

  for (const key of keys) {
    const before = (a as any)[key]
    const after = (b as any)[key]

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diffs.push({
        revision: b.revision,
        field: key,
        before,
        after,
      })
    }
  }

  return diffs
}
