import { ConversationState } from "../kernel/types"
import { DiffEntry } from "./types"

export function diffMeta(
  a: ConversationState,
  b: ConversationState
): DiffEntry[] {
  const diffs: DiffEntry[] = []

  const keys = new Set([
    ...Object.keys(a.meta),
    ...Object.keys(b.meta),
  ])

  for (const key of keys) {
    const before = a.meta[key]
    const after = b.meta[key]

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diffs.push({
        revision: b.revision,
        field: `meta.${key}`,
        before,
        after,
      })
    }
  }

  return diffs
}
