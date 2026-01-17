// chat/kernel/transition.ts

import { NodeId } from "./types";

/**
 * Alle tilladte transition-typer.
 * Lukket sæt.
 */
export type TransitionType =
  | "NODE_HOP"
  | "PARENTESE_OPEN"
  | "PARENTESE_CLOSE"
  | "TERMINAL"
  | "REJECT";

/**
 * Transition er den ENESTE måde state må ændres.
 * Atomar og deterministisk.
 */
export type Transition = {
  type: TransitionType;

  /**
   * Node vi forlader
   */
  from: NodeId;

  /**
   * Node vi går til (hvis relevant)
   */
  to?: NodeId;

  /**
   * Maskinlæsbar forklaring.
   * Bruges til logging og replay.
   */
  reason: string;
};

/**
 * Hjælpere til entydige transitions
 * (ingen logik – kun struktur)
 */
export function nodeHop(
  from: NodeId,
  to: NodeId,
  reason: string
): Transition {
  return { type: "NODE_HOP", from, to, reason };
}

export function parenOpen(
  from: NodeId,
  to: NodeId,
  reason: string
): Transition {
  return { type: "PARENTESE_OPEN", from, to, reason };
}

export function parenClose(
  from: NodeId,
  reason: string
): Transition {
  return { type: "PARENTESE_CLOSE", from, reason };
}

export function terminal(
  from: NodeId,
  reason: string
): Transition {
  return { type: "TERMINAL", from, reason };
}

export function reject(
  from: NodeId,
  reason: string
): Transition {
  return { type: "REJECT", from, reason };
}
