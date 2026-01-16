// guided-chat/router.ts

import { Chip } from "./chips";
import { NodeId, ROUTES } from "./node-router";
import { NODES, NodeConfig } from "./nodes";

/* =====================
   INPUT TYPES
===================== */

export type RouterInput =
  | { kind: "chip"; chip: Chip }
  | { kind: "text"; text: string };

export type RouterResult = {
  nodeId: NodeId;
  node: NodeConfig;
  reason: "chip" | "text" | "fallback";
};

/* =====================
   ROUTER
===================== */

export function route(
  currentNodeId: NodeId,
  input: RouterInput
): RouterResult {
  const currentNode = NODES[currentNodeId];

  // --- CHIP NAVIGATION ---
  if (input.kind === "chip") {
    const nextNodeId = ROUTES[currentNodeId]?.[input.chip];

    if (nextNodeId) {
      return {
        nodeId: nextNodeId,
        node: NODES[nextNodeId],
        reason: "chip",
      };
    }

    // chip ikke tilladt i denne node
    return {
      nodeId: currentNodeId,
      node: currentNode,
      reason: "fallback",
    };
  }

  // --- FREE TEXT ---
  if (input.kind === "text") {
    // Hvis noden er dialog, bliver vi i noden
    if (currentNode.kind === "DIALOG") {
      return {
        nodeId: currentNodeId,
        node: currentNode,
        reason: "text",
      };
    }

    // Fritekst i ikke-dialog → fallback (brug chips)
    return {
      nodeId: currentNodeId,
      node: currentNode,
      reason: "fallback",
    };
  }

  // --- SAFETY ---
  return {
    nodeId: currentNodeId,
    node: currentNode,
    reason: "fallback",
  };
}
