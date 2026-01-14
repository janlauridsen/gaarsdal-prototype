export type ChipId = string;
export type NodeId = string;

export type ResolvedIntent =
  | { kind: "CHIP"; chipId: ChipId }
  | { kind: "PARENTESE"; nodeId: NodeId }
  | { kind: "NEW_SESSION" };

export type Action =
  | { type: "NODE_HOP"; to: NodeId }
  | { type: "OPEN_PARENTESE"; to: NodeId }
  | { type: "REQUEST_NEW_SESSION_CONFIRMATION" }
  | { type: "START_NEW_SESSION" }
  | { type: "FALLBACK" };
