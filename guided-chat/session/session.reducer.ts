// guided-chat/session/session.reducer.ts

import { SessionState } from "./session.types";
import { CONFIDENCE_CONFIG } from "../config/confidence-config";

function initializeConfidence(): SessionState["confidence"] {
  return CONFIDENCE_CONFIG.reduce((acc, cfg) => {
    acc[cfg.dimension] = cfg.initialValue;
    return acc;
  }, {} as SessionState["confidence"]);
}

export function createInitialSessionState(): SessionState {
  return {
    meta: {},
    confidence: initializeConfidence()
  };
}
