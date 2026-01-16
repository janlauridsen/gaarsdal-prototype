// guided-chat/config/state-select-topic.ts

export const SELECT_TOPIC_STATE_DATA = {
  id: "select_topic",

  purpose: "Brugeren vælger hvilken type problem der skal arbejdes med",

  ui_projection: {
    text: "Hvad drejer dit spørgsmål sig om?"
  },

  allowed_actions: [
    "choice"
  ],

  produces: [
    "topic_selected"
  ],

  updates_meta: [
    "problem_model"
  ],

  summary_hints: [
    "topic_selected"
  ]
};
