// guided-chat/nodes.ts

import { START_STATE_DATA } from "./config/state-start";

/**
 * Midlertidig adapter.
 * Gør det muligt at blande data-drevne og kode-drevne states.
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
      // eksisterende side effects uændret
      return context;
    },

    onSignal(signal: any, context: any) {
      // eksisterende routing fortsætter uændret
      return context;
    }
  }
};
