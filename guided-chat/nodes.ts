export type NodeConfig = {
  id: string;
  kind: "MENU" | "STATIC" | "DIALOG";
  message: string;
  chips: string[];
  terminal?: boolean;
  navigation: {
    chips: string[];
    freeText: {
      allowParentesTo?: string[];
      allowNewSession: boolean;
    };
  };
};

export const NODES: Record<string, NodeConfig> = {
  ROOT: {
    id: "ROOT",
    kind: "MENU",
    message: "Velkommen. Du kan vælge en mulighed herunder eller skrive frit.",
    chips: ["Læs om hypnose", "Er hypnose relevant for mig?", "Kontakt"],
    navigation: {
      chips: ["Læs om hypnose", "Er hypnose relevant for mig?", "Kontakt"],
      freeText: {
        allowParentesTo: [],
        allowNewSession: true,
      },
    },
  },

  /* EKSEMPEL */
  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    message: "Lad os afklare, om hypnoterapi kan være relevant.",
    chips: ["Ja", "Nej"],
    navigation: {
      chips: ["Ja", "Nej"],
      freeText: {
        allowParentesTo: ["ALTERNATIVER"],
        allowNewSession: true,
      },
    },
  },
};
