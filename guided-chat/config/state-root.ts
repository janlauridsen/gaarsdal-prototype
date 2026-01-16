// guided-chat/config/state-root.ts

export const ROOT_STATE_DATA = {
  id: "ROOT",

  purpose: "Primær indgang til systemet og overblik over muligheder",

  ui_projection: {
    text: "Velkommen. Du kan vælge en mulighed herunder eller skrive frit."
  },

  allowed_actions: [
    "choice"
  ],

  produces: [
    "initial_interest"
  ],

  updates_meta: [
    "problem_model"
  ],

  summary_hints: [
    "initial_interest"
  ]
};
