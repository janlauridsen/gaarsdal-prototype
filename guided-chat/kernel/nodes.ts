// guided-chat/kernel/nodes.ts

export type NodeId = string;

export interface NodeDefinition {
  id: NodeId;
  allowed_transitions: NodeId[];
}

export const NODES: Record<NodeId, NodeDefinition> = {
  START: {
    id: "START",
    allowed_transitions: ["ROOT"],
  },
  ROOT: {
    id: "ROOT",
    allowed_transitions: [],
  },
};
