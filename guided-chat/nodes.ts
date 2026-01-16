// guided-chat/nodes.ts

import { START_STATE_DATA } from "./config/state-start";
import { SELECT_TOPIC_STATE_DATA } from "./config/state-select-topic";

/**
 * Midlertidig adapter.
 * Data-drevne states + eksisterende runtime-logik.
 */

export const nodes = {
  start: {
    id: START_STATE_DATA.id,

    render() {
      return {
        text: START_STATE_DATA.ui_projection.text,
        chips: START_STATE_DATA.allowed_actions.map(actionId => ({
          actionId
        }))
      };
    },

    onEnter(context: any) {
      return context;
    },

    onSignal(signal: any, context: any) {
      return context;
    }
  },

  select_topic: {
    id: SELECT_TOPIC_STATE_DATA.id,

    render() {
      return {
        text: SELECT_TOPIC_STATE_DATA.ui_projection.text,
        chips: SELECT_TOPIC_STATE_DATA.allowed_actions.map(actionId => ({
          actionId
        }))
      };
    },

    onEnter(context: any) {
      return context;
    },

    onSignal(signal: any, context: any) {
      return context;
    }
  }
};
