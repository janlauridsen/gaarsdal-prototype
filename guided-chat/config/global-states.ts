// guided-chat/config/global-states.ts

export const GLOBAL_STATES = {
  HOME: {
    id: "GLOBAL_HOME",
    purpose: "Returnerer brugeren til systemets startpunkt",
    ui_projection: {
      text: "Du er nu tilbage ved start. Hvad vil du gerne gøre?"
    },
    allowed_actions: ["choice"],
    produces: [],
    updates_meta: [],
    summary_hints: []
  },

  CONTACT_PHONE: {
    id: "GLOBAL_PHONE",
    purpose: "Viser information om telefonkontakt",
    ui_projection: {
      text: "Du kan kontakte mig telefonisk på +45 42 80 74 74."
    },
    allowed_actions: [],
    produces: [],
    updates_meta: [],
    summary_hints: []
  },

  CONTACT_MAIL: {
    id: "GLOBAL_MAIL",
    purpose: "Viser information om mailkontakt",
    ui_projection: {
      text: "Du kan skrive til mig på jan@gaarsdal.net."
    },
    allowed_actions: [],
    produces: [],
    updates_meta: [],
    summary_hints: []
  },

  EMERGENCY: {
    id: "GLOBAL_EMERGENCY",
    purpose: "Akut information ved behov for øjeblikkelig hjælp",
    ui_projection: {
      text:
        "Hvis du har brug for akut hjælp, kontakt lægevagten eller ring 112."
    },
    allowed_actions: [],
    produces: [],
    updates_meta: [],
    summary_hints: []
  }
};
