// guided-chat/nodes.ts

import { Chip } from "./chips";
import { NodeId } from "./node-router";

/**
 * NodeKind definerer hvordan noden opfører sig:
 * - MENU: kun navigation via chips
 * - STATIC: statisk tekst + evt. prompt
 * - DIALOG: fri tekst + intern dialog (fx triage)
 */
export type NodeKind = "MENU" | "STATIC" | "DIALOG";

export type NodeConfig = {
  id: NodeId;
  title?: string;
  message: string;
  chips: Chip[];
  prompt?: string;
  terminal?: boolean;
  kind?: NodeKind;
};

export const NODES: Record<NodeId, NodeConfig> = {
  ROOT: {
    id: "ROOT",
    kind: "MENU",
    message: "Vælg en mulighed for at fortsætte.",
    chips: ["FACTS_HYPNO", "TRIAGE_RELEVANCE", "CONTACT"],
  },

  FACTS: {
    id: "FACTS",
    kind: "STATIC",
    message: "Her kan du læse generel, nøgtern information om hypnoterapi.",
    chips: ["TRIAGE_RELEVANCE", "CONTACT", "BACK_TO_ROOT"],
    prompt: "facts-hypno.prompt.md",
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    message:
      "Lad os afklare, om hypnoterapi kan være relevant for dig. Du kan skrive frit.",
    chips: ["CONTACT", "BACK_TO_ROOT"],
    prompt: "triage-relevance.prompt.md",
  },

  CONTACT: {
    id: "CONTACT",
    kind: "STATIC",
    message:
      "Her finder du kontaktinformation og mulighed for at tage næste skridt.",
    chips: ["BACK_TO_ROOT"],
    prompt: "contact.prompt.md",
    terminal: true,
  },

  TRIAGE_DONE: {
    id: "TRIAGE_DONE",
    kind: "STATIC",
    message:
      "Tak. Ud fra det beskrevne kan hypnoterapi være relevant – eller ikke. Du vælger selv næste skridt.",
    chips: ["CONTACT", "BACK_TO_ROOT"],
    terminal: true,
  },

  EXIT: {
    id: "EXIT",
    kind: "STATIC",
    message: "Samtalen er afsluttet.",
    chips: [],
    terminal: true,
  },
};
