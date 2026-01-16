// guided-chat/session/session.types.ts

import { MetaPersistence } from "../config/meta-domains";

export interface MetaValue {
  value: unknown;
  updatedFromState: string;
  timestamp: number;
}

export type MetaStore = Record<string, MetaValue>;

export interface SessionState {
  meta: MetaStore;
  confidence: {
    problem_understanding: number;
    state_alignment: number;
    signal_clarity: number;
    stability: number;
  };
}
