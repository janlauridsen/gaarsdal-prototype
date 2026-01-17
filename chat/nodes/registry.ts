import { Node } from "../kernel/types"

const RAW_REGISTRY: Record<string, Node> = {
  START: {
    id: "START",
    kind: "MENU",
    goal: "entry",
    allowed_exits: ["END"],
    meta_domains_written: [],
  },
  END: {
    id: "END",
    kind: "TERMINAL",
    goal: "end",
    allowed_exits: [],
    meta_domains_written: [],
  },
}

const REGISTRY: Record<string, Readonly<Node>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_REGISTRY).map(([k, v]) => [
      k,
      Object.freeze(v),
    ])
  )
)

export function getNode(id: string): Readonly<Node> {
  const node = REGISTRY[id]
  if (!node) throw new Error(`unknown node: ${id}`)
  return node
}
