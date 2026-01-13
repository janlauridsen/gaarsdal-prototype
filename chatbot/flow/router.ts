import { FLOW_NODES, NodeId } from "./nodes";
import { Chip } from "./chips";

export function resolveNextNode(
  currentNode: NodeId,
  inputChip?: Chip
): NodeId {
  if (!inputChip) return currentNode;

  // Global escape
  if (inputChip === "BACK_TO_ROOT") return "ROOT";

  const node = FLOW_NODES[currentNode];

  if (!node.allowedChips.includes(inputChip)) {
    return currentNode;
  }

  switch (inputChip) {
    case "CONTACT":
      return "CONTACT";
    case "FACTS_HYPNO":
      return "FACTS_HYPNO";
    case "TRIAGE_RELEVANCE":
      return "TRIAGE_RELEVANCE";
    default:
      return currentNode;
  }
}
