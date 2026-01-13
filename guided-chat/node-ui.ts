// guided-chat/node-ui.ts

import { NodeId } from "./node-router";
import { Chip } from "./chips";

export const NODE_CHIPS: Record<NodeId, Chip[]> = {
  ROOT: [
    "CONTACT",
    "FACTS_HYPNO",
    "TRIAGE_RELEVANCE",
  ],

  CONTACT: [
    "BACK_TO_ROOT",
  ],

  FACTS: [
    "BACK_TO_ROOT",
  ],

  TRIAGE: [
    "BACK_TO_ROOT",
  ],

  TRIAGE_DONE: [
    "CONTACT",
    "BACK_TO_ROOT",
  ],

  EXIT: [],
};
