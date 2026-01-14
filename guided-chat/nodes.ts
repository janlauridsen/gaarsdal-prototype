/**
 * guided-chat/nodes.ts
 *
 * Rolle:
 * - Ren node-konfiguration
 * - Ingen logik
 * - Ingen state
 * - Ingen triage-engine
 *
 * Version:
 * - V10.3
 * - FASE 4 · STEP 1
 */

export type NodeKind = "MENU" | "STATIC" | "DIALOG";

export type FreeTextConfig = {
  /**
   * Node-ids der må åbnes som parentes (midlertidigt sidespor)
   */
  allowParentesTo: string[];

  /**
   * Om denne node må foreslå opstart af ny samtale (nyt stack-entry)
   * Bemærk: Dette er kun tilladelse til at foreslå, aldrig auto-start
   */
  allowNewSession: boolean;
};

export type NodeNavigation = {
  /**
   * Chips der vises i UI og kan navigeres til
   */
  chips: string[];

  /**
   * Fritekst-kontrakt for noden
   */
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
 *
 * Regler:
 * - Alle navigationsmuligheder er eksplicitte
 * - Fritekst må kun føre til eksisterende chips eller tilladte spring
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
