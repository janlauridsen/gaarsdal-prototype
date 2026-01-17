import { NodeId } from "../kernel"

export type RouterContext = {
  active_node: NodeId
}

export type RouteResult = {
  nodeId: NodeId
  allowedExits: NodeId[]
}
