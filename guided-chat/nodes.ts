export type NodeKind = "MENU" | "STATIC" | "DIALOG";

export type FreeTextConfig = {
  allowParentesTo?: string[];
  allowNewSession: boolean;
};

export type NodeNavigation = {
  chips: string[];
  freeText: FreeTextConfig;
};

export type NodeConfig = {
  id: string;
  kind: NodeKind;
  message: string;
  chips: string[];
  terminal?: boolean;
  navigation: NodeNavigation;
};

/**
 * NODE DEFINITIONS
 * Version: V10.3 / FASE 4
 *
 * Regler:
 * - Alle navigationsmuligheder er eksplicitte
 * - Fritekst må kun føre til eksisterende chips eller konfigurerede spring
 * - Ingen implicitte noder
 */

export const NODES: Record<string, NodeConfig> = {
  ROOT: {
    id: "ROOT",
    kind: "MENU",
    message:
      "Velkommen. Du kan vælge en mulighed herunder eller skrive frit.",
    chips: [
      "Læs om hypnoterapi",
      "Er hypnoterapi relevant for mig?",
      "Kontakt",
    ],
    navigation: {
      chips: [
        "Læs om hypnoterapi",
        "Er hypnoterapi relevant for mig?",
        "Kontakt",
      ],
      freeText: {
        allowParentesTo: [],
        allowNewSession: true,
      },
    },
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    message:
      "Lad os afklare, om hypnoterapi kan være relevant i din situation.",
    chips: ["Ja", "Nej"],
    navigation: {
      chips: ["Ja", "Nej"],
      freeText: {
        allowParentesTo: [],
        allowNewSession: true,
      },
    },
  },
};
