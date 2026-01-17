import { RouterContext, RouteResult } from "./types"
import { getNode } from "../nodes/registry"

export function route(context: RouterContext): RouteResult {
  const node = getNode(context.state.active_node)

  return {
    nodeId: node.id,
    allowedExits: node.allowed_exits,
  }
}
