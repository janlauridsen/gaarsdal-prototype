// guided-chat/nodes.ts

import { Chip } from "./chips";
import { NodeId } from "./node-router";

export type NodeConfig = {
  id: NodeId;
  title?: string;
  message: string;
  chips: Chip[];
  prompt?: string; // kun reference, ikke load
  terminal?: boolean;
};

export const NODES: Record<NodeId, NodeConfig> = {
  ROOT: {
    id: "ROOT",
    message: "Vælg en mulighed for at fortsætte.",
    chips: ["FACTS_HYPNO", "TRIAGE_RELEVANCE", "CONTACT"],
  },

  FACTS: {
    id: "FACTS",
    message: "Her kan du læse generel, nøgtern information om hypnoterapi.",
    chips: ["TRIAGE_RELEVANCE", "CONTACT", "BACK_TO_ROOT"],
    prompt: "facts-hypno.prompt.md",
  },

  TRIAGE: {
    id: "TRIAGE",
    message:
      "Lad os afklare, om hypnoterapi kan være relevant for dig. Du kan skrive frit.",
    chips: ["CONTACT", "BACK_TO_ROOT"],
    prompt: "triage-relevance.prompt.md",
  },

  CONTACT: {
    id: "CONTACT",
    message:
      "Her finder du kontaktinformation og mulighed for at tage næste skridt.",
    chips: ["BACK_TO_ROOT"],
    prompt: "contact.prompt.md",
    terminal: true,
  },

  TRIAGE_DONE: {
    id: "TRIAGE_DONE",
    message:
      "Tak. Ud fra det beskrevne er hypnose enten relevant eller ikke relevant. Du vælger selv næste skridt.",
    chips: ["CONTACT", "BACK_TO_ROOT"],
    terminal: true,
  },

  OFFRAMP: {
    id: "OFFRAMP",
    message:
      "Dette falder uden for, hvad denne chatbot kan hjælpe med.",
    chips: ["BACK_TO_ROOT"],
    terminal: true,
  },
};
