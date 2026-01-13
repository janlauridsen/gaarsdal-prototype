// guided-chat/node-resolver.ts

import { NodeId, ROUTES } from "./node-router";
import { Chip } from "./chips";

export function resolveNextNode(
  current: NodeId,
  chip: Chip
): NodeId {
  const next = ROUTES[current]?.[chip];
  return next ?? current;
}
