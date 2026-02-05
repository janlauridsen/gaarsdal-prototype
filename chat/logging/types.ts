import {
  NodeId,
  InputSignal,
  Transition,
} from '../kernel'

export type LogEvent = {
  conversation_id: string
  revision_before: number
  revision_after: number
  active_node_before: NodeId
  active_node_after: NodeId
  input_type: InputSignal['type']
  transition_type: Transition['type']
  timestamp: string
}
