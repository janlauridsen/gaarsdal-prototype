/**
 * ENGINE
 * Single point of truth for state mutation.
 */

import {
  ConversationState,
  InputSignal,
  Transition,
} from "../kernel";
import { resolveRoutes } from "../router";
import { EngineResult } from "./types";

/* =========================
   ENGINE ENTRY
========================= */

export function runEngine(
  state: ConversationState,
  signal: InputSignal,
  stack_depth: number
): EngineResult {
  const routes = resolveRoutes({
    active_node: state.active_node,
    stack_depth,
  });

  const transition = selectTransition(routes.allowed, signal, state);

  if (!transition) {
    return {
      kind: "REJECTED",
      reason: "No valid transition for signal",
      state,
    };
  }

  const next_state = applyTransition(state, transition);

  return {
    kind: "APPLIED",
    transition,
    next_state,
  };
}

/* =========================
   SELECTION LOGIC
========================= */

function selectTransition(
  allowed: readonly any[],
  signal: InputSignal,
  state: ConversationState
): Transition | null {
  switch (signal.type) {
    case "EXPLICIT_TRANSITION": {
      const match = allowed.find(
        (t) => t.type === "NODE_HOP" && t.to === signal.target
      );
      if (!match) return null;

      return {
        type: "NODE_HOP",
        from: state.active_node,
        to: signal.target,
        reason: "explicit",
      };
    }

    case "SYSTEM": {
      if (signal.intent === "TERMINATE") {
        const match = allowed.find((t) => t.type === "TERMINAL");
        if (!match) return null;

        return {
          type: "TERMINAL",
          from: state.active_node,
          reason: "system",
        };
      }
      return null;
    }

    case "FREE_TEXT": {
      // Free text må ikke implicit navigere
      return null;
    }

    default:
      return null;
  }
}

/* =========================
   STATE REDUCER
========================= */

function applyTransition(
  state: ConversationState,
  transition: Transition
): ConversationState {
  const base = {
    ...state,
    revision: state.revision + 1,
  };

  switch (transition.type) {
    case "NODE_HOP":
      return {
        ...base,
        active_node: transition.to!,
        allowed_transitions: [],
      };

    case "TERMINAL":
      return {
        ...base,
        status: "completed",
      };

    default:
      return base;
  }
}
