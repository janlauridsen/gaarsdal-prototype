import {
  ConversationState,
  InputSignal,
  Transition,
  KernelResult,
  LogEvent,
  Node,
} from './types'
import { assertStateInvariants, applyTransition } from './state'
import { getNode } from '../nodes/registry'

export function runKernel(
  state: ConversationState,
  input: InputSignal
): KernelResult {
  assertStateInvariants(state)

  const node: Node = getNode(state.active_node)

  let transition: Transition

  switch (input.type) {
    case 'EXPLICIT_TRANSITION':
      transition = {
        type: 'NODE_HOP',
        from: state.active_node,
        to: input.target,
        reason: 'explicit transition',
      }
      break

    case 'SYSTEM':
      if (input.intent === 'TERMINATE') {
        transition = {
          type: 'TERMINAL',
          from: state.active_node,
          reason: 'system terminate',
        }
      } else {
        transition = {
          type: 'REJECT',
          from: state.active_node,
          reason: 'unknown system intent',
        }
      }
      break

    case 'FREE_TEXT':
      transition = {
        type: 'REJECT',
        from: state.active_node,
        reason: 'free text not actionable in kernel',
      }
      break

    default:
      throw new Error('Unknown input signal')
  }

  const nextState =
    transition.type === 'REJECT'
      ? state
      : applyTransition(state, transition, node)

  const log: LogEvent = {
    conversation_id: state.conversation_id,
    revision_before: state.revision,
    revision_after: nextState.revision,
    active_node_before: state.active_node,
    active_node_after: nextState.active_node,
    input_type: input.type,
    transition_type: transition.type,
    timestamp: new Date().toISOString(),
  }

  return {
    state: nextState,
    transition,
    log,
  }
}
