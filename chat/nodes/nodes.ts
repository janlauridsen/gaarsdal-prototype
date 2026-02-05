/**
 * NODE-DATA
 * Eksempeldata. Kan erstattes 100 % uden runtime-ændringer.
 */

import { NodeDefinition } from "./types";

export const NODES: Record<string, NodeDefinition> = {
  ROOT: {
    id: "ROOT",
    kind: "MENU",
    content: {
      message:
        "Velkommen. Du kan vælge en mulighed herunder eller skrive frit.",
    },
    navigation: {
      allowed: ["ABOUT", "TRIAGE", "CONTACT"],
      allow_free_text: true,
      allow_parentese: false,
    },
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    content: {
      message:
        "Lad os afklare, om hypnoterapi kan være relevant for dig.",
    },
    navigation: {
      allowed: ["TRIAGE_YES", "TRIAGE_NO"],
      allow_free_text: true,
      allow_parentese: true,
    },
  },

  TRIAGE_YES: {
    id: "TRIAGE_YES",
    kind: "TERMINAL",
    content: {
      message:
        "Det lyder som noget, der kan arbejdes videre med.",
    },
    navigation: {
      allowed: [],
      allow_free_text: false,
      allow_parentese: false,
    },
  },

  TRIAGE_NO: {
    id: "TRIAGE_NO",
    kind: "TERMINAL",
    content: {
      message:
        "Det lyder ikke som noget hypnoterapi typisk anvendes til.",
    },
    navigation: {
      allowed: [],
      allow_free_text: false,
      allow_parentese: false,
    },
  },
};
