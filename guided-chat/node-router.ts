// guided-chat/node-router.ts

import { Chip } from "./chips";

export type NodeId =
  | "ROOT"
  | "FACTS"
  | "TRIAGE"
  | "CONTACT"
  | "TRIAGE_DONE"
  | "OFFRAMP";

export type NodeRoute = {
  from: NodeId;
  via: Chip;
  to: NodeId;
};

export const NODE_ROUTES: NodeRoute[] = [
  // Root menu
  { from: "ROOT", via: "FACTS_HYPNO", to: "FACTS" },
  { from: "ROOT", via: "TRIAGE_RELEVANCE", to: "TRIAGE" },
  { from: "ROOT", via: "CONTACT", to: "CONTACT" },

  // Facts
  { from: "FACTS", via: "BACK_TO_ROOT", to: "ROOT" },
  { from: "FACTS", via: "TRIAGE_RELEVANCE", to: "TRIAGE" },
  { from: "FACTS", via: "CONTACT", to: "CONTACT" },

  // Triage
  { from: "TRIAGE", via: "CONTACT", to: "CONTACT" },
  { from: "TRIAGE", via: "BACK_TO_ROOT", to: "ROOT" },

  // Triage outcomes (dummy for nu)
  { from: "TRIAGE", via: "FACTS_HYPNO", to: "TRIAGE_DONE" },

  // Fallback
  { from: "TRIAGE_DONE", via: "BACK_TO_ROOT", to: "ROOT" },
];
