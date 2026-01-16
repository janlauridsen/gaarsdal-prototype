// guided-chat/nodes.ts

import { START_STATE_DATA } from "./config/state-start";
import { SELECT_TOPIC_STATE_DATA } from "./config/state-select-topic";
import { ROOT_STATE_DATA } from "./config/state-root";
import { TRIAGE_STATE_DATA } from "./config/state-triage";

/**
 * Midlertidigt adapter-lag.
 * Alle states har nu deklarativ semantik.
 * Runtime-logik forbliver uændret.
 */

function renderFromStateData(stateData: any) {
  return {
    text: stateData.ui_projection.text,
    chips: stateData.allowed_actions.map((actionId: string) => ({
      actionId
    }))
  };
}

export const nodes = {
  start: {
    id: START_STATE_DATA.id,
    render: () => renderFromStateData(START_STATE_DATA),
    onEnter: (context: any) => context,
    onSignal: (signal: any, context: any) => context
  },

  select_topic: {
    id: SELECT_TOPIC_STATE_DATA.id,
    render: () => renderFromStateData(SELECT_TOPIC_STATE_DATA),
    onEnter: (context: any) => context,
    onSignal: (signal: any, context: any) => context
  },

  ROOT: {
    id: ROOT_STATE_DATA.id,
    render: () => renderFromStateData(ROOT_STATE_DATA),
    onEnter: (context: any) => context,
    onSignal: (signal: any, context: any) => context
  },

  TRIAGE: {
    id: TRIAGE_STATE_DATA.id,
    render: () => renderFromStateData(TRIAGE_STATE_DATA),
    onEnter: (context: any) => context,
    onSignal: (signal: any, context: any) => context
  }
};
