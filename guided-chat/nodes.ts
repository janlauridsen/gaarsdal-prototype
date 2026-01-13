// guided-chat/nodes.ts

import { Chip } from "./chips";

export type NodeType = "menu" | "ai_dialog" | "terminal";

export type GuidedNode = {
  id: string;
  type: NodeType;
  prompt?: string;            // kun for ai_dialog
  text?: string;              // fast tekst til menu / terminal
  chips: Chip[];              // autoriserede valg
  next?: Record<Chip, string>; // chip -> næste node
};

export const NODES: Record<string, GuidedNode> = {
  ROOT: {
    id: "ROOT",
    type: "menu",
    text: "Vælg en mulighed for at fortsætte.",
    chips: ["CONTACT", "FACTS_HYPNO", "TRIAGE_RELEVANCE"],
    next: {
      CONTACT: "CONTACT_NODE",
      FACTS_HYPNO: "FACTS_NODE",
      TRIAGE_RELEVANCE: "TRIAGE_NODE",
    },
  },

  CONTACT_NODE: {
    id: "CONTACT_NODE",
    type: "terminal",
    text: "Her er kontaktoplysningerne.",
    chips: ["BACK_TO_ROOT"],
    next: {
      BACK_TO_ROOT: "ROOT",
    },
  },

  FACTS_NODE: {
    id: "FACTS_NODE",
    type: "ai_dialog",
    prompt: "facts-hypno.prompt.md",
    chips: ["BACK_TO_ROOT"],
    next: {
      BACK_TO_ROOT: "ROOT",
    },
  },

  TRIAGE_NODE: {
    id: "TRIAGE_NODE",
    type: "ai_dialog",
    prompt: "triage-relevance.prompt.md",
    chips: ["BACK_TO_ROOT"],
    next: {
      BACK_TO_ROOT: "ROOT",
    },
  },
};
