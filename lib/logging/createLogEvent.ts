// lib/logging/createLogEvent.ts

import { randomUUID } from "crypto";
import { RMRCLogEvent } from "./logEvent";

/**
 * Runtime-invariant checks:
 * - Slås til implicit (throw)
 * - Designet til at fange arkitekturbrud tidligt
 * - Ingen side effects
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`RMRC LOG INVARIANT VIOLATION: ${message}`);
  }
}

export interface CreateLogEventParams {
  sessionId: string;
  layer: RMRCLogEvent["layer"];
  eventType: RMRCLogEvent["eventType"];

  turn?: number;
  role?: string;

  payload: Record<string, any>;
}

export function createLogEvent(
  params: CreateLogEventParams
): RMRCLogEvent {
  assert(!!params.sessionId, "sessionId is required");
  assert(!!params.layer, "layer is required");
  assert(!!params.eventType, "eventType is required");
  assert(
    typeof params.payload === "object",
    "payload must be an object"
  );

  if (params.role) {
    assert(
      params.eventType === "role_execution",
      "role may only be set for role_execution events"
    );
  }

  if (params.turn !== undefined) {
    assert(
      Number.isInteger(params.turn) && params.turn >= 0,
      "turn must be a non-negative integer"
    );
  }

  const event: RMRCLogEvent = {
    eventId: randomUUID(),
    sessionId: params.sessionId,
    timestamp: new Date().toISOString(),

    layer: params.layer,
    eventType: params.eventType,

    turn: params.turn,
    role: params.role,

    payload: params.payload,
  };

  return event;
}
