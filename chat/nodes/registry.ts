import { Node } from '../kernel/types'

const NODE_REGISTRY: Record<string, Node> = {
  START: {
    id: 'START',
    kind: 'MENU',
    goal: 'entry',
    allowed_exits: ['END'],
    meta_domains_written: [],
  },
  END: {
    id: 'END',
    kind: 'TERMINAL',
    goal: 'end',
    allowed_exits: [],
    meta_domains_written: [],
  },
}

export function getNode(id: string): Node {
  const node = NODE_REGISTRY[id]
  if (!node) throw new Error(`Unknown node: ${id}`)
  return node
}
