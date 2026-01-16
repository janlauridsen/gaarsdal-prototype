// guided-chat/config/state-start.ts

export const START_STATE_DATA = {
  id: "start",

  purpose: "Indgang til samtalen og valg af første handling",

  ui_projection: {
    text: "Hvad kan jeg hjælpe dig med?",
  },

  allowed_actions: [
    "choice"
  ],

  produces: [
    "initial_intent"
  ],

  updates_meta: [
    "problem_model"
  ],

  summary_hints: [
    "initial_intent"
  ]
};
