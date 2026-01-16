// guided-chat/config/state-triage.ts

export const TRIAGE_STATE_DATA = {
  id: "TRIAGE",

  purpose: "Afklarer om hypnoterapi er relevant for brugerens situation",

  ui_projection: {
    text: "Lad os afklare, om hypnoterapi kan være relevant i din situation."
  },

  allowed_actions: [
    "choice"
  ],

  produces: [
    "triage_result"
  ],

  updates_meta: [
    "problem_model"
  ],

  summary_hints: [
    "triage_result"
  ]
};
