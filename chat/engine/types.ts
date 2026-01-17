/**
 * ENGINE CONTRACT
 * Vælger præcis én transition og reducerer state deterministisk.
 */

import { ConversationState, InputSignal, Transition } from "../kernel";
import { AllowedTransition } from "../router";

/* =========================
   ENGINE RESULT
========================= */

export type EngineResult =
  | {
      kind: "APPLIED";
      transition: Transition;
      next_state: ConversationState;
    }
  | {
      kind: "REJECTED";
      reason: string;
      state: ConversationState;
    };
