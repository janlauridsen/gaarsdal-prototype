import { NodeDef } from "./nodes";

export const NODE_TABLE: Record<string, NodeDef> = {
  ROOT: {
    id: "ROOT",
    type: "MENU",
    chips: [
      { label: "Kontakt", target: "CONTACT" },
      { label: "Hvad er hypnoterapi?", target: "FACTS_HYPNO" },
      { label: "Er hypnoterapi relevant for mig?", target: "TRIAGE" },
    ],
  },

  CONTACT: {
    id: "CONTACT",
    type: "STATIC",
    prompt: "Kontaktinformation:\n…",
    chips: [{ label: "Tilbage", target: "ROOT" }],
  },

  FACTS_HYPNO: {
    id: "FACTS_HYPNO",
    type: "STATIC",
    prompt: "Fakta om hypnoterapi:\n…",
    chips: [{ label: "Tilbage", target: "ROOT" }],
  },

  TRIAGE: {
    id: "TRIAGE",
    type: "DIALOG",
  },

  TRIAGE_DONE: {
    id: "TRIAGE_DONE",
    type: "MENU",
    chips: [
      { label: "Book tid", target: "CONTACT" },
      { label: "Tal med Jan", target: "CONTACT" },
      { label: "Tilbage", target: "ROOT" },
    ],
  },
};
