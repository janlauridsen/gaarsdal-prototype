import {
  ConversationState,
  Transition,
  Node,
  MetaStore,
} from './types'

export function assertStateInvariants(state: ConversationState): void {
  if (!state.conversation_id) throw new Error('Missing conversation_id')
  if (state.revision < 0) throw new Error('Invalid revision')
  if (!state.active_node) throw new Error('Missing active_node')
  if (!Array.isArray(state.allowed_transitions))
    throw new Error('allowed_transitions must be array')
}

export function applyTransition(
  state: ConversationState,
  transition: Transition,
  node: Node
): ConversationState {
  if (transition.from !== state.active_node) {
    throw new Error('Transition.from mismatch')
  }

  if (transition.type === 'REJECT') {
    return { ...state }
  }

  if (transition.to && !node.allowed_exits.includes(transition.to)) {
    throw new Error('Transition.to not allowed by node')
  }

  const nextState: ConversationState = {
    ...state,
    revision: state.revision + 1,
    active_node: transition.to ?? state.active_node,
    allowed_transitions: transition.to
      ? node.allowed_exits
      : state.allowed_transitions,
    status:
      transition.type === 'TERMINAL'
        ? 'completed'
        : state.status,
  }

  assertStateInvariants(nextState)
  return nextState
}

export function writeMeta(
  meta: MetaStore,
  node: Node,
  updates: MetaStore
): MetaStore {
  const next: MetaStore = { ...meta }

  for (const key of Object.keys(updates)) {
    if (!node.meta_domains_written.includes(key)) {
      throw new Error(`Meta domain not writable: ${key}`)
    }
    next[key] = updates[key]
  }

  return next
}
