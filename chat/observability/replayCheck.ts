import { ConversationState } from "../kernel/types"
import { DiffResult } from "./types"
import { diffStates } from "./diff"

export function replayCheck(
  original: ConversationState[],
  replayed: ConversationState[]
): DiffResult {
  const diffs = []

  const len = Math.min(original.length, replayed.length)

  for (let i = 0; i < len; i++) {
    diffs.push(
      ...diffStates(original[i], replayed[i])
    )
  }

  if (original.length !== replayed.length) {
    diffs.push({
      revision: -1,
      field: "length",
      before: original.length,
      after: replayed.length,
    })
  }

  return diffs
}

