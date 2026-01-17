import {
  ConversationState,
  InputSignal,
  Transition,
} from "../kernel"
import { EngineResult } from "./types"

export function runEngine(
  state: ConversationState,
  input: InputSignal
): EngineResult {
  let transition: Transition

  switch (input.type) {
    case "EXPLICIT_TRANSITION":
      transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: input.target,
        reason: "explicit transition",
      }
      break

    case "SYSTEM":
      transition = {
        type: "REJECT",
        from: state.active_node,
        reason: "system input not handled by engine",
      }
      break

    case "FREE_TEXT":
      transition = {
        type: "REJECT",
        from: state.active_node,
        reason: "free text not routable",
      }
      break

    default:
      throw new Error("Unknown input")
  }

  return { transition }
}
